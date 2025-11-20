export enum PositionType {
  LONG = 'LONG',   // 買いポジション
  SHORT = 'SHORT'  // 売りポジション
}

export interface Position {
  id: number;                  // ポジションID
  type: PositionType;          // ポジション種別
  entryDate: Date;             // 取得日
  entryPrice: number;          // 取得単価
  quantity: number;            // 数量（株数）
  label: string;               // ラベル（例: "買い1", "売り2"）
}

export interface ClosedPosition extends Position {
  exitDate: Date;              // 決済日
  exitPrice: number;           // 決済単価
  profit: number;              // 損益（円）
  profitRate: number;          // 損益率（%）
}
