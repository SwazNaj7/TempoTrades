// TypeScript interfaces for Database & AI JSON
// Based on database-schema.md specifications

export type TradeResult = 'break_even' | 'take_profit' | 'stopped_out';
export type TradeDirection = 'long' | 'short';
export type SetupGrade = 'A+' | 'A' | 'A-' | 'B' | 'C';
export type Confidence = 'high' | 'medium' | 'low';
export type MarketBias = 'bullish' | 'bearish' | 'neutral';
export type DisplacementQuality = 'strong' | 'weak' | 'none';
export type TradeSession = 'new_york_am' | 'new_york_pm' | 'asia' | 'london';

// Database Trade Record
export interface Trade {
  id: string;
  user_id: string;
  instrument: string;
  timeframe: string;
  direction: TradeDirection | null;
  result: TradeResult;
  session: TradeSession | null;
  profit_amount: number | null;
  risk_reward: number | null;
  open_time: string;
  close_time: string;
  image_url: string;
  setup_grade: SetupGrade | null;
  ai_confidence: Confidence | null;
  ai_reasoning: string | null;
  overlay_entry_x: number | null;
  overlay_entry_y: number | null;
  notes: string | null;
  created_at: string;
}

// Form data for creating a trade
export interface TradeFormData {
  instrument: string;
  timeframe: string;
  direction: TradeDirection;
  result: TradeResult;
  open_time: string;
  close_time: string;
  notes?: string;
}

// AI Vision API Response (from strat-context.md)
export interface AIAnalysisResponse {
  analysis: {
    direction: MarketBias;
    market_structure: {
      liquidity_sweep_detected: boolean;
      displacement_quality: DisplacementQuality;
      fvg_entry_valid: boolean;
      smt_divergence_visible: boolean;
    };
    visual_comparison: {
      matches_reference_structure: boolean;
      deviation_notes: string;
    };
  };
  grading: {
    score: SetupGrade;
    confidence: number;
    missing_confluence: string[];
  };
  chart_overlay: {
    entry_point: { x: number; y: number };
    stop_loss: { x: number; y: number };
  };
  reasoning_summary: string;
}

// Simplified AI Response for form pre-fill
export interface AIFormData {
  market_bias: MarketBias;
  confluence_factors: string[];
  setup_grade: SetupGrade;
  confidence: number;
  entry_coordinate: { x: number; y: number };
  reasoning: string;
}

// User Profile
export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  timezone: string | null;
  created_at: string;
}

// Dashboard Stats
export interface TradeStats {
  total_trades: number;
  win_rate: number;
  grade_distribution: {
    'A+': number;
    'A': number;
    'A-': number;
    'B': number;
    'C': number;
  };
  result_distribution: {
    take_profit: number;
    stopped_out: number;
    break_even: number;
  };
  average_duration_hours: number;
  session_performance: {
    london: { wins: number; total: number };
    new_york: { wins: number; total: number };
    asian: { wins: number; total: number };
  };
}

// Filter options for dashboard
export interface TradeFilters {
  timeframe?: string;
  result?: TradeResult;
  instrument?: string;
  grade?: SetupGrade;
  dateFrom?: string;
  dateTo?: string;
}
