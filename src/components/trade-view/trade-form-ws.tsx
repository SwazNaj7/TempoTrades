'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarIcon, Loader2, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ImageUpload } from './image-upload';
import { GradeBadge } from './grade-badge';
import { toast } from 'sonner';
import { uploadTrade, analyzeChartImage } from '@/app/actions';
import { FALLBACK_INSTRUMENTS } from '@/lib/deriv/types';
import {
  fetchDerivActiveSymbols,
  type DerivPair,
  type DerivPairCatalog,
  type PairGroupId,
} from '@/lib/deriv/websocket';
import type { AIFormData, SetupGrade, TradeDirection, TradeResult, TradeSession } from '@/types/trade';

const timeframes = ['1m', '5m', '15m', '1h', '4h', 'D', 'W', 'M'];

const sessions: { value: TradeSession; label: string }[] = [
  { value: 'new_york_am', label: 'New York AM' },
  { value: 'new_york_pm', label: 'New York PM' },
  { value: 'asia', label: 'Asia' },
  { value: 'london', label: 'London' },
];

const results: { value: TradeResult; label: string }[] = [
  { value: 'take_profit', label: 'Take Profit' },
  { value: 'stopped_out', label: 'Stopped Out' },
  { value: 'break_even', label: 'Break Even' },
];

const grades: { value: SetupGrade; label: string }[] = [
  { value: 'A+', label: 'A+' },
  { value: 'A', label: 'A' },
  { value: 'A-', label: 'A-' },
  { value: 'B', label: 'B' },
  { value: 'C', label: 'C' },
];

function buildFallbackCatalog(): DerivPairCatalog {
  const pairs: DerivPair[] = FALLBACK_INSTRUMENTS.map((inst) => {
    const isSynthetic = inst.categoryId === 'synthetics';
    const market = isSynthetic ? 'synthetic_index' : inst.categoryId;
    return {
      symbol: inst.symbol,
      displayName: inst.displayName,
      market,
      marketLabel: isSynthetic ? 'Synthetic Indices' : inst.categoryId,
      submarket: inst.categoryId,
      submarketLabel: isSynthetic ? 'Synthetic Indices' : inst.categoryId,
      group: isSynthetic ? 'synthetic' : 'standard',
    };
  });

  const groups: DerivPairCatalog['groups'] = [
    { id: 'standard', label: 'Standard', submarkets: [] },
    { id: 'synthetic', label: 'Synthetic', submarkets: [] },
  ];

  for (const group of groups) {
    const groupPairs = pairs.filter((p) => p.group === group.id);
    const seen = new Map<string, DerivPair[]>();
    for (const pair of groupPairs) {
      if (!seen.has(pair.submarketLabel)) seen.set(pair.submarketLabel, []);
      seen.get(pair.submarketLabel)!.push(pair);
    }
    group.submarkets = [...seen.entries()].map(([label, subPairs]) => ({
      label,
      pairs: subPairs,
    }));
  }

  return { groups, pairs, source: 'fallback' };
}

export function WsTradeForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Form state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [catalog, setCatalog] = useState<DerivPairCatalog | null>(null);
  const [isLoadingInstruments, setIsLoadingInstruments] = useState(true);
  const [groupId, setGroupId] = useState<PairGroupId | ''>('');
  const [instrument, setInstrument] = useState('');
  const [timeframe, setTimeframe] = useState('');
  const [direction, setDirection] = useState<TradeDirection>('long');
  const [result, setResult] = useState<TradeResult>('take_profit');
  const [grade, setGrade] = useState<SetupGrade>('C');
  const [session, setSession] = useState<TradeSession | ''>('');
  const [riskReward, setRiskReward] = useState('');
  const [profitAmount, setProfitAmount] = useState('');
  const [openTime, setOpenTime] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [closeTime, setCloseTime] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [notes, setNotes] = useState('');

  // AI Analysis state
  const [aiAnalysis, setAiAnalysis] = useState<AIFormData | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadInstruments = async () => {
      setIsLoadingInstruments(true);
      try {
        const data = await fetchDerivActiveSymbols();
        if (cancelled) return;

        setCatalog(data);
        setGroupId((current) => current || 'standard');

        if (data.source === 'fallback') {
          toast.message('Using backup Deriv pairs', {
            description: 'Live Deriv symbol feed was unavailable.',
          });
        }
      } catch {
        if (!cancelled) {
          const fallback = buildFallbackCatalog();
          setCatalog(fallback);
          setGroupId('standard');
          toast.error('Could not reach Deriv. Using backup pairs.');
        }
      } finally {
        if (!cancelled) {
          setIsLoadingInstruments(false);
        }
      }
    };

    void loadInstruments();
    return () => {
      cancelled = true;
    };
  }, []);

  const activeGroup = useMemo(
    () => catalog?.groups.find((g) => g.id === groupId) ?? null,
    [catalog, groupId]
  );

  const handleGroupChange = (nextGroup: PairGroupId) => {
    setGroupId(nextGroup);
    setInstrument('');
  };

  const handleImageChange = (file: File | null, preview: string | null) => {
    setImageFile(file);
    setImagePreview(preview);
    setAiAnalysis(null);
  };

  const handleAnalyze = async () => {
    if (!imagePreview) {
      toast.error('Please upload an image first');
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await analyzeChartImage(imagePreview);

      if (!response.success) {
        toast.error(response.error || 'Analysis failed');
        return;
      }

      const analysis = response.data;
      setAiAnalysis(analysis);
      setDirection(analysis.market_bias === 'bullish' ? 'long' : 'short');
      toast.success('Analysis complete!');
    } catch {
      toast.error('Analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!instrument || !timeframe) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Calculate profit amount based on result
    let finalProfitAmount = 0;
    if (profitAmount) {
      const amount = Math.abs(parseFloat(profitAmount));
      if (result === 'take_profit') {
        finalProfitAmount = amount;
      } else if (result === 'stopped_out') {
        finalProfitAmount = -amount;
      } else {
        finalProfitAmount = 0;
      }
    }

    setIsSubmitting(true);
    try {
      const formData = {
        setupGrade: grade,
        tradeResult: result,
        session: session || null,
        pair: instrument,
        timeframe: timeframe,
        notes: notes || undefined,
        tradeDate: openTime,
        profit_amount: finalProfitAmount,
        risk_reward: riskReward ? parseFloat(riskReward) : undefined,
      };

      const uploadResult = await uploadTrade(formData, imagePreview, aiAnalysis);

      if (!uploadResult.success) {
        toast.error(uploadResult.error || 'Failed to save trade');
        return;
      }

      toast.success('Trade logged successfully!');
      router.push('/dashboard/journal');
      router.refresh();
    } catch {
      toast.error('Failed to save trade');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column - Image Upload */}
        <div className="space-y-4">
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Chart Image</CardTitle>
              <CardDescription>
                Upload your trade setup screenshot
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ImageUpload
                value={imagePreview ?? undefined}
                onChange={handleImageChange}
                disabled={isAnalyzing}
              />

              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={handleAnalyze}
                disabled={!imageFile || isAnalyzing}
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Analyze with AI
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* AI Analysis Results */}
          {aiAnalysis && (
            <Card className="bg-card/50 backdrop-blur border-primary/30">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">AI Analysis</CardTitle>
                  <GradeBadge grade={aiAnalysis.setup_grade as SetupGrade} size="lg" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-muted-foreground text-xs uppercase tracking-wide">
                    Market Bias
                  </Label>
                  <p className="font-medium capitalize">{aiAnalysis.market_bias || 'N/A'}</p>
                </div>

                {aiAnalysis.confluence_factors && aiAnalysis.confluence_factors.length > 0 && (
                  <div>
                    <Label className="text-muted-foreground text-xs uppercase tracking-wide">
                      Confluence Factors
                    </Label>
                    <ul className="mt-1 space-y-1">
                      {aiAnalysis.confluence_factors.map((factor, i) => (
                        <li key={i} className="text-sm flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                          {factor}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div>
                  <Label className="text-muted-foreground text-xs uppercase tracking-wide">
                    Reasoning
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {aiAnalysis.reasoning || 'No reasoning provided'}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Trade Details */}
        <div className="space-y-4">
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Trade Details</CardTitle>
              <CardDescription>
                Enter your trade information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="group">Market *</Label>
                  <Select
                    value={groupId}
                    onValueChange={(value) => handleGroupChange(value as PairGroupId)}
                    disabled={isLoadingInstruments || !catalog}
                  >
                    <SelectTrigger id="group" className="w-full bg-background/50">
                      <SelectValue
                        placeholder={isLoadingInstruments ? 'Loading markets...' : 'Select market'}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {catalog?.groups.map((group) => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instrument">Instrument *</Label>
                  <Select
                    value={instrument}
                    onValueChange={setInstrument}
                    disabled={isLoadingInstruments || !activeGroup || activeGroup.submarkets.length === 0}
                  >
                    <SelectTrigger id="instrument" className="w-full bg-background/50">
                      <SelectValue
                        placeholder={isLoadingInstruments ? 'Loading pairs...' : 'Select pair'}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {activeGroup?.submarkets.map((submarket) => (
                        <SelectGroup key={submarket.label}>
                          <SelectLabel>{submarket.label}</SelectLabel>
                          {submarket.pairs.map((pair) => (
                            <SelectItem key={pair.symbol} value={pair.displayName}>
                              {pair.displayName}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="timeframe">Timeframe *</Label>
                  <Select value={timeframe} onValueChange={setTimeframe}>
                    <SelectTrigger id="timeframe" className="w-full bg-background/50">
                      <SelectValue placeholder="Select TF" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeframes.map((tf) => (
                        <SelectItem key={tf} value={tf}>
                          {tf}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="direction">Direction</Label>
                  <Select value={direction} onValueChange={(v) => setDirection(v as TradeDirection)}>
                    <SelectTrigger id="direction" className="w-full bg-background/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="long">Long</SelectItem>
                      <SelectItem value="short">Short</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="result">Result *</Label>
                  <Select value={result} onValueChange={(v) => setResult(v as TradeResult)}>
                    <SelectTrigger id="result" className="w-full bg-background/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {results.map((r) => (
                        <SelectItem key={r.value} value={r.value}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="grade">Setup Grade *</Label>
                  <Select value={grade} onValueChange={(v) => setGrade(v as SetupGrade)}>
                    <SelectTrigger id="grade" className="w-full bg-background/50">
                      <SelectValue placeholder="Select grade" />
                    </SelectTrigger>
                    <SelectContent>
                      {grades.map((g) => (
                        <SelectItem key={g.value} value={g.value}>
                          {g.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Profit/Loss Amount */}
              <div className="space-y-2">
                <Label htmlFor="profitAmount" className="flex items-center gap-2">
                  Profit/Loss Amount
                  <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                    result === 'take_profit'
                      ? 'bg-emerald-500/10 text-emerald-500'
                      : result === 'stopped_out'
                      ? 'bg-red-500/10 text-red-500'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {result === 'take_profit' ? '+' : result === 'stopped_out' ? '-' : '±0'}
                  </span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    id="profitAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder={result === 'break_even' ? '0.00' : '100.00'}
                    value={result === 'break_even' ? '' : profitAmount}
                    onChange={(e) => setProfitAmount(e.target.value)}
                    disabled={result === 'break_even'}
                    className="bg-background/50 pl-7"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {result === 'take_profit' && 'Enter the profit amount (will be saved as positive)'}
                  {result === 'stopped_out' && 'Enter the loss amount (will be saved as negative)'}
                  {result === 'break_even' && 'Break even trades are automatically set to $0'}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="session">Session</Label>
                <Select
                  value={session || undefined}
                  onValueChange={(v) => setSession(v as TradeSession)}
                >
                  <SelectTrigger className="bg-background/50">
                    <SelectValue placeholder="Select session (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {sessions.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="riskReward">Risk : Reward</Label>
                  <Input
                    id="riskReward"
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="2.0"
                    value={riskReward}
                    onChange={(e) => setRiskReward(e.target.value)}
                    className="bg-background/50"
                  />
                </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="openTime" className="flex items-center gap-1.5">
                    <CalendarIcon className="h-3.5 w-3.5" />
                    Open Time
                  </Label>
                  <Input
                    id="openTime"
                    type="datetime-local"
                    value={openTime}
                    onChange={(e) => setOpenTime(e.target.value)}
                    className="bg-background/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="closeTime" className="flex items-center gap-1.5">
                    <CalendarIcon className="h-3.5 w-3.5" />
                    Close Time
                  </Label>
                  <Input
                    id="closeTime"
                    type="datetime-local"
                    value={closeTime}
                    onChange={(e) => setCloseTime(e.target.value)}
                    className="bg-background/50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Session narrative, liquidity observations, psychology notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="bg-background/50 min-h-25"
                />
              </div>
            </CardContent>
          </Card>

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={isSubmitting || !imageFile}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving Trade...
              </>
            ) : (
              'Save Trade'
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
