export interface StockData {
  date: Date;                  // 日付
  open: number;                // 始値
  high: number;                // 高値
  low: number;                 // 安値
  close: number;               // 終値
  volume: number;              // 出来高
}

export interface ChartData {
  date: Date;                  // 日付
  open: number;                // 始値
  high: number;                // 高値
  low: number;                 // 安値
  close: number;               // 終値
  ma5?: number;                // 5日移動平均
  ma25?: number;               // 25日移動平均
  ma75?: number;               // 75日移動平均
  rsi?: number;                // RSI（14日）
}
