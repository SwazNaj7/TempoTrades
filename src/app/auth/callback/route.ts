import { createClient } from '@/lib/supabase/server';
import { NextResponse, type NextRequest } from 'next/server';
import { getSiteUrl } from '@/lib/site-url';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const origin = getSiteUrl(request);

  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // Check if user has a username set
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', user.id)
          .single();
        
        // If no username, redirect to complete profile
        if (!profile?.username) {
          return NextResponse.redirect(`${origin}/complete-profile`);
        }
      }
      
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Return to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
