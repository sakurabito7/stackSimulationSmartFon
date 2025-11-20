import { Position, ClosedPosition } from './position.model';
import { Trade } from './trade.model';

export interface SimulationConfig {
  symbol: string;              // 銘柄コード（例: "7203"）
  startDate: Date;             // シミュレーション開始日
  period: number;              // シミュレーション期間（日数）
  initialCash: number;         // 初期資金
  tradeAmount: number;         // 1回の取引金額
  maxPositions: number;        // 最大保有ポジション数（デフォルト: 5）
  csvFile?: File;              // CSVファイル（アップロード時）
}

export interface SimulationState {
  currentDay: number;          // 現在の経過日数（0始まり）
  currentDate: Date;           // 現在日付
  cash: number;                // 現金残高
  positions: Position[];       // 保有中のポジション
  closedPositions: ClosedPosition[];  // 決済済みポジション
  trades: Trade[];             // 全取引履歴
  nextPositionId: number;      // 次のポジションID
  nextLongLabel: number;       // 次のロングポジションラベル番号
  nextShortLabel: number;      // 次のショートポジションラベル番号
  performance?: PerformanceMetrics;  // 投資成績（シミュレーション終了時）
}

export interface PerformanceMetrics {
  winRate: number;             // 勝率（%）
  profitRate: number;          // 利益率（%）
  expectedValue: number;       // 期待値（円）
  maxDrawdown: number;         // 最大ドローダウン（円）
  totalTrades: number;         // 総取引回数
  winTrades: number;           // 勝ち取引数
  loseTrades: number;          // 負け取引数
  avgProfit: number;           // 平均利益（円）
  avgLoss: number;             // 平均損失（円）
  profitFactor: number;        // プロフィットファクター
  totalProfit: number;         // 総利益（円）
  totalLoss: number;           // 総損失（円）
}
