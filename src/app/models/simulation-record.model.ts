import { Timestamp } from '@angular/fire/firestore';
import { Trade } from './trade.model';
import { DailyData } from './simulation-config.model';

export interface SimulationRecord {
  id?: string;
  createdAt: Timestamp | Date;

  config: {
    csvFileName: string;
    startDate: string;
    period: number;
    initialCash: number;
    tradeAmount: number;
    maxPositions: number;
  };

  summary: {
    finalCash: number;
    totalProfit: number;
    totalLoss: number;
    netProfit: number;
    profitRate: number;
    totalTrades: number;
    winRate: number;
    winTrades: number;
    loseTrades: number;
    avgProfit: number;
    avgLoss: number;
    expectedValue: number;
    maxDrawdown: number;
    profitFactor: number;
  };

  trades: Trade[];
  dailyData: DailyData[];  // 日次データ（全日分）
}
