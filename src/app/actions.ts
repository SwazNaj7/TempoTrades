'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { VISION_SYSTEM_PROMPT } from '@/lib/ai-prompting';
import type { AIFormData, Trade, SetupGrade, TradeDirection, TradeResult, TradeSession } from '@/types/trade';
import {
  FALLBACK_INSTRUMENTS,
  INSTRUMENT_CATEGORIES,
  getCachedDerivInstrumentCatalog,
  type DerivInstrumentCatalog,
} from '@/lib/deriv/symbols';

// ============================================================================
// Types
// ============================================================================

type ActionResult<T = void> = 
  | { success: true; data: T }
  | { success: false; error: string };

export interface TradeUploadData {
  setupGrade: SetupGrade;
  tradeResult: TradeResult;
  session: TradeSession | null;
  pair: string;
  timeframe: string;
  direction: TradeDirection;
  notes?: string;
  tradeDate: string;
  profit_amount?: number;
  risk_reward?: number;
}

export interface UpdateTradeData {
  instrument: string;
  timeframe: string;
  direction: TradeDirection | null;
  result: TradeResult;
  session: TradeSession | null;
  setup_grade: SetupGrade;
  risk_reward?: number | null;
  profit_amount?: number | null;
  open_time: string;
  close_time: string;
  notes?: string | null;
}

// ============================================================================
// Trade Actions
// ============================================================================

/**
 * Load Deriv instruments from TradingView symbol search (cached).
 */
export async function getDerivInstruments(): Promise<ActionResult<DerivInstrumentCatalog>> {
  try {
    const catalog = await getCachedDerivInstrumentCatalog();
    return { success: true, data: catalog };
  } catch (error) {
    console.error('Failed to load Deriv instruments:', error);
    return {
      success: true,
      data: {
        categories: INSTRUMENT_CATEGORIES,
        instruments: FALLBACK_INSTRUMENTS,
        source: 'fallback',
      },
    };
  }
}

/**
 * Analyze a chart image using Google Gemini Vision API
 */
export async function analyzeChartImage(
  base64Image: string
): Promise<ActionResult<AIFormData>> {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return { success: false, error: 'Gemini API key not configured' };
    }

    if (!base64Image) {
      return { success: false, error: 'No image provided' };
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Extract base64 data and mime type
    const matches = base64Image.match(/^data:(.+);base64,(.+)$/);
    if (!matches) {
      console.error('Image format issue. Starts with:', base64Image.substring(0, 50));
      return { success: false, error: 'Invalid image format. Please upload a valid image.' };
    }
    const mimeType = matches[1];
    const base64Data = matches[2];

    const result = await model.generateContent([
      VISION_SYSTEM_PROMPT,
      {
        inlineData: {
          mimeType: mimeType,
          data: base64Data,
        },
      },
    ]);

    const content = result.response.text();

    if (!content) {
      return { success: false, error: 'No analysis returned' };
    }

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { success: false, error: 'Invalid analysis format' };
    }

    const analysis: AIFormData = JSON.parse(jsonMatch[0]);
    return { success: true, data: analysis };
  } catch (error) {
    console.error('Chart analysis error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Analysis failed' 
    };
  }
}

/**
 * Upload a trade with all associated data
 */
export async function uploadTrade(
  formData: TradeUploadData,
  imageBase64: string | null,
  aiAnalysis: AIFormData | null
): Promise<ActionResult<Trade>> {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    const user = session?.user ?? null;
    if (authError || !user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Ensure user has a profile (handles users who signed up before trigger existed)
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (!existingProfile) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || null,
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        return { success: false, error: 'Failed to create user profile' };
      }
    }

    // Basic validation
    if (!formData.setupGrade || !formData.tradeResult || !formData.pair) {
      return { 
        success: false, 
        error: 'Missing required fields' 
      };
    }

    let imageUrl: string | null = null;

    // Upload image to Supabase Storage if provided
    if (imageBase64 && imageBase64.includes(',')) {
      // Extract mime type and base64 data
      const matches = imageBase64.match(/^data:(.+);base64,(.+)$/);
      if (matches) {
        const mimeType = matches[1];
        const base64Data = matches[2];
        const buffer = Buffer.from(base64Data, 'base64');
        
        // Always use webp extension for consistency
        const fileName = `${user.id}/${Date.now()}.webp`;

        console.log('Uploading image:', { mimeType, fileName, bufferSize: buffer.length });

        const { error: uploadError } = await supabase.storage
          .from('trade-screenshots')
          .upload(fileName, buffer, {
            contentType: 'image/webp',
            upsert: false,
          });

        if (uploadError) {
          console.error('Image upload error:', uploadError);
          return { success: false, error: `Image upload failed: ${uploadError.message}` };
        }

        // Construct the public URL manually to ensure correctness
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        imageUrl = `${supabaseUrl}/storage/v1/object/public/trade-screenshots/${fileName}`;
        console.log('Image uploaded successfully:', imageUrl);
      } else {
        console.error('Could not parse base64 image data');
      }
    }

    // Prepare trade data
    // Convert local datetime to ISO string with timezone preserved
    // The tradeDate comes as "YYYY-MM-DDTHH:mm" from datetime-local input
    // We need to treat it as local time and convert properly
    const localDate = new Date(formData.tradeDate);
    const isoDateTime = localDate.toISOString();

    const tradeData = {
      user_id: user.id,
      instrument: formData.pair,
      timeframe: formData.timeframe,
      direction: formData.direction,
      result: formData.tradeResult,
      session: formData.session ?? null,
      open_time: isoDateTime,
      close_time: isoDateTime,
      image_url: imageUrl || '',
      setup_grade: formData.setupGrade,
      ai_confidence: aiAnalysis ? 'high' : null,
      ai_reasoning: aiAnalysis?.reasoning || null,
      overlay_entry_x: aiAnalysis?.entry_coordinate?.x || null,
      overlay_entry_y: aiAnalysis?.entry_coordinate?.y || null,
      notes: formData.notes || null,
      profit_amount: formData.profit_amount ?? null,
      risk_reward: formData.risk_reward ?? null,
      created_at: new Date().toISOString(),
    };

    // Insert trade
    const { data: trade, error: insertError } = await supabase
      .from('trades')
      .insert(tradeData)
      .select()
      .single();

    if (insertError) {
      console.error('Trade insert error:', insertError);
      return { success: false, error: 'Failed to save trade' };
    }

    // Revalidate relevant paths
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/journal');
    revalidatePath('/dashboard/journaling');
    revalidatePath('/dashboard/analysis');

    return { success: true, data: trade as Trade };
  } catch (error) {
    console.error('Upload trade error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to upload trade' 
    };
  }
}

/**
 * Get all trades for the current user
 */
export async function getTrades(): Promise<ActionResult<Trade[]>> {
  try {
    const supabase = await createClient();

    const { data: { session }, error: authError } = await supabase.auth.getSession();
    const user = session?.user ?? null;
    if (authError || !user) {
      return { success: false, error: 'Not authenticated' };
    }

    const { data: trades, error } = await supabase
      .from('trades')
      .select(
        'id, user_id, instrument, timeframe, direction, result, session, profit_amount, risk_reward, open_time, close_time, setup_grade, notes, image_url, created_at'
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: trades as Trade[] };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch trades' 
    };
  }
}

/**
 * Get a single trade by ID
 */
export async function getTradeById(tradeId: string): Promise<ActionResult<Trade>> {
  try {
    const supabase = await createClient();

    const { data: { session }, error: authError } = await supabase.auth.getSession();
    const user = session?.user ?? null;
    if (authError || !user) {
      return { success: false, error: 'Not authenticated' };
    }

    const { data: trade, error } = await supabase
      .from('trades')
      .select('*')
      .eq('id', tradeId)
      .eq('user_id', user.id)
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    if (!trade) {
      return { success: false, error: 'Trade not found' };
    }

    return { success: true, data: trade as Trade };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch trade' 
    };
  }
}

/**
 * Update an existing trade by ID (user-editable fields only).
 */
export async function updateTrade(
  tradeId: string,
  data: UpdateTradeData
): Promise<ActionResult<Trade>> {
  try {
    const supabase = await createClient();

    const { data: { session }, error: authError } = await supabase.auth.getSession();
    const user = session?.user ?? null;
    if (authError || !user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Basic validation
    if (!data.instrument || !data.timeframe || !data.result || !data.setup_grade) {
      return { success: false, error: 'Missing required fields' };
    }

    const { data: updated, error } = await supabase
      .from('trades')
      .update({
        instrument: data.instrument,
        timeframe: data.timeframe,
        direction: data.direction,
        result: data.result,
        session: data.session,
        setup_grade: data.setup_grade,
        risk_reward: data.risk_reward ?? null,
        profit_amount: data.profit_amount ?? null,
        open_time: data.open_time,
        close_time: data.close_time,
        notes: data.notes ?? null,
      })
      .eq('id', tradeId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/journal');
    revalidatePath('/dashboard/analysis');
    revalidatePath(`/dashboard/journal/${tradeId}`);

    return { success: true, data: updated as Trade };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update trade',
    };
  }
}

/**
 * Delete a trade by ID
 */
export async function deleteTrade(tradeId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();

    const { data: { session }, error: authError } = await supabase.auth.getSession();
    const user = session?.user ?? null;
    if (authError || !user) {
      return { success: false, error: 'Not authenticated' };
    }

    // First get the trade to delete its image
    const { data: trade } = await supabase
      .from('trades')
      .select('image_url')
      .eq('id', tradeId)
      .eq('user_id', user.id)
      .single();

    // Delete image from storage if exists
    if (trade?.image_url) {
      const path = trade.image_url.split('/trade-screenshots/')[1];
      if (path) {
        await supabase.storage.from('trade-screenshots').remove([path]);
      }
    }

    // Delete the trade
    const { error } = await supabase
      .from('trades')
      .delete()
      .eq('id', tradeId)
      .eq('user_id', user.id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/journaling');
    revalidatePath('/dashboard/analysis');

    return { success: true, data: undefined };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete trade' 
    };
  }
}

// ============================================================================
// Chat Actions
// ============================================================================

/**
 * Send a message to the AI trading buddy
 */
export async function sendChatMessage(
  message: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<ActionResult<string>> {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return { success: false, error: 'Gemini API key not configured' };
    }

    const { CHAT_SYSTEM_PROMPT } = await import('@/lib/ai-prompting');

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Convert history to Gemini format
    const chatHistory = history.slice(-10).map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    const chat = model.startChat({
      history: [
        { role: 'user', parts: [{ text: CHAT_SYSTEM_PROMPT }] },
        { role: 'model', parts: [{ text: 'I understand. I will act as your expert trading mentor following the PB Blake Mechanical Trading Model.' }] },
        ...chatHistory,
      ],
    });

    const result = await chat.sendMessage(message);
    const content = result.response.text();

    if (!content) {
      return { success: false, error: 'No response from AI' };
    }

    return { success: true, data: content };
  } catch (error) {
    console.error('Chat error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Chat failed' 
    };
  }
}

// ============================================================================
// Profile Actions
// ============================================================================

/**
 * Get the current user's profile
 */
export async function getProfile(): Promise<ActionResult<{ 
  id: string; 
  email: string | null; 
  full_name: string | null; 
  username: string | null;
  avatar_url: string | null;
  timezone: string | null;
}>> {
  try {
    const supabase = await createClient();
    
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    const user = session?.user ?? null;
    if (authError || !user) {
      return { success: false, error: 'Not authenticated' };
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, username, avatar_url, timezone')
      .eq('id', user.id)
      .single();

    if (error) {
      // If profile doesn't exist, create one
      if (error.code === 'PGRST116') {
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || null,
            username: null,
            avatar_url: null,
            timezone: null,
          })
          .select('id, email, full_name, username, avatar_url, timezone')
          .single();

        if (createError) {
          return { success: false, error: 'Failed to create profile' };
        }

        return { success: true, data: newProfile };
      }
      return { success: false, error: 'Failed to fetch profile' };
    }

    return { success: true, data: profile };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch profile',
    };
  }
}

/**
 * Update the current user's profile
 */
export async function updateProfile(data: { full_name?: string; username?: string; avatar_url?: string; timezone?: string }): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    const user = session?.user ?? null;
    if (authError || !user) {
      return { success: false, error: 'Not authenticated' };
    }

    const { error } = await supabase
      .from('profiles')
      .update(data)
      .eq('id', user.id);

    if (error) {
      console.error('Profile update error:', error);
      return { success: false, error: 'Failed to update profile' };
    }

    revalidatePath('/dashboard/settings');
    return { success: true, data: undefined };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update profile',
    };
  }
}

/**
 * Upload avatar image to storage and update profile
 */
export async function uploadAvatar(formData: FormData): Promise<ActionResult<{ url: string }>> {
  try {
    const supabase = await createClient();
    
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    const user = session?.user ?? null;
    if (authError || !user) {
      return { success: false, error: 'Not authenticated' };
    }

    const file = formData.get('avatar') as File;
    if (!file) {
      return { success: false, error: 'No file provided' };
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return { success: false, error: 'Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.' };
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return { success: false, error: 'File too large. Maximum size is 5MB.' };
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      console.error('Avatar upload error:', uploadError);
      // Provide more specific error messages
      if (uploadError.message?.includes('bucket') || uploadError.message?.includes('not found')) {
        return { success: false, error: 'Storage bucket not configured. Please create the "avatars" bucket in Supabase Storage.' };
      }
      if (uploadError.message?.includes('policy') || uploadError.message?.includes('permission')) {
        return { success: false, error: 'Permission denied. Storage policies may not be configured correctly.' };
      }
      return { success: false, error: `Upload failed: ${uploadError.message}` };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    // Update profile with new avatar URL
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', user.id);

    if (updateError) {
      console.error('Profile avatar update error:', updateError);
      return { success: false, error: 'Failed to update profile with avatar' };
    }

    revalidatePath('/dashboard/settings');
    return { success: true, data: { url: publicUrl } };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload avatar',
    };
  }
}

// ============================================================================
// Auth Actions
// ============================================================================

/**
 * Usernames that should never be assignable to a regular account.
 */
const RESERVED_USERNAMES = new Set([
  'admin',
  'root',
  'support',
  'tempotrades',
  'mechify',
  'api',
  'moderator',
  'official',
  'help',
  'info',
  'contact',
  'security',
  'null',
  'undefined',
  'anonymous',
]);

/**
 * Result of a username availability lookup.
 */
export type UsernameCheckResult =
  | { available: true }
  | { available: false; reason: string };

/**
 * Check whether a username is available using a server-side, parameterized
 * (managed) query. The value is normalized and validated here, then passed
 * through Supabase's PostgREST client via `.eq()`, which binds it as a
 * parameter — it is never interpolated into SQL, so the query is safe from SQL
 * injection. An unauthenticated caller is fine because the lookup only selects
 * the `username` column (governed by RLS).
 */
export async function checkUsernameAvailability(raw: string): Promise<UsernameCheckResult> {
  // Normalize + validate input before it touches the database.
  const username = (raw || '').trim().toLowerCase();

  if (!username) {
    return { available: false, reason: 'Username must be 3-20 characters (letters, numbers, underscore).' };
  }
  if (username.length < 3 || username.length > 20) {
    return { available: false, reason: 'Username must be 3-20 characters.' };
  }
  if (!/^[a-z0-9_]+$/.test(username)) {
    return { available: false, reason: 'Username can only contain letters, numbers, and underscores.' };
  }
  if (RESERVED_USERNAMES.has(username)) {
    return { available: false, reason: 'This username is reserved.' };
  }

  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username)
      .maybeSingle();

    if (error) {
      console.error('Username availability check failed:', error);
      // Fail closed: don't let a transient error grant a username we couldn't verify.
      return { available: false, reason: 'Unable to verify username right now. Please try again.' };
    }

    return data
      ? { available: false, reason: 'Username is already taken.' }
      : { available: true };
  } catch (error) {
    console.error('Username check error:', error);
    return { available: false, reason: 'Unable to verify username right now. Please try again.' };
  }
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: undefined };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Sign out failed' 
    };
  }
}

