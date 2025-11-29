export type SignalType = 'LONG' | 'SHORT' | 'WAIT';

export interface TradePlan {
  entry: string;
  sl: string;
  tp1: string;
  tp2: string;
  logic: string;
}

export interface AnalysisResult {
  summary: string;
  signal: SignalType;
  plan?: TradePlan;
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface TradeRecord {
  id: string;
  symbol: string;
  direction: 'Long' | 'Short';
  entryPrice: number;
  exitPrice: number;
  pnl: number; // USDT
  roi: number; // Percentage
  timestamp: number;
}

export interface Stats {
  totalTrades: number;
  winRate: number;
  cumulativeProfit: number;
}
