import { PositionType } from './position.model';

export enum TradeAction {
  BUY = 'BUY',     // 買い
  SELL = 'SELL'    // 売り
}

export interface Trade {
  date: Date;                  // 取引日
  action: TradeAction;         // 取引種別
  price: number;               // 取引単価
  quantity: number;            // 数量
  positionType: PositionType;  // ポジション種別
  positionId: number;          // ポジションID
  label: string;               // ラベル
  isClosing: boolean;          // 決済取引かどうか
  profit?: number;             // 決済時の損益
}
