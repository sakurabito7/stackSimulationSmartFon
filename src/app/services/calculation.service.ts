import { Injectable } from '@angular/core';
import { StockData, ChartData } from '../models/stock-data.model';
import { Position, PositionType } from '../models/position.model';

export interface OffsetPoint {
  positions: Position[];       // 対象ポジション
  labels: string[];            // ポジションラベル
  offsetPrice: number;         // 相殺価格
  netQuantity: number;         // 正味数量
  direction: 'LONG' | 'SHORT' | 'NEUTRAL';  // 方向
}

@Injectable({
  providedIn: 'root'
})
export class CalculationService {

  /**
   * 移動平均（MA5, MA25, MA75）とRSIを計算
   */
  calculateChartData(stockData: StockData[], currentDay: number): ChartData[] {
    const chartData: ChartData[] = stockData.map(d => ({ ...d }));

    // 終値を抽出
    const closes = stockData.map(d => d.close);

    // 移動平均を計算
    const ma5 = this.calculateMA(closes, 5);
    const ma25 = this.calculateMA(closes, 25);
    const ma75 = this.calculateMA(closes, 75);

    // RSIを計算
    const rsi = this.calculateRSI(closes, 14);

    // データをマージ
    for (let i = 0; i < chartData.length; i++) {
      chartData[i].ma5 = ma5[i];
      chartData[i].ma25 = ma25[i];
      chartData[i].ma75 = ma75[i];
      chartData[i].rsi = rsi[i];
    }

    return chartData;
  }

  /**
   * 移動平均を計算 (Simple Moving Average)
   */
  private calculateMA(data: number[], period: number): (number | undefined)[] {
    const result: (number | undefined)[] = [];

    for (let i = 0; i < data.length; i++) {
      if (i < period - 1) {
        result.push(undefined);
      } else {
        const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
        result.push(sum / period);
      }
    }

    return result;
  }

  /**
   * RSI（相対力指数）を計算
   */
  private calculateRSI(closes: number[], period: number = 14): (number | undefined)[] {
    const result: (number | undefined)[] = [];

    if (closes.length < period + 1) {
      return closes.map(() => undefined);
    }

    // 変化量を計算
    const changes: number[] = [];
    for (let i = 1; i < closes.length; i++) {
      changes.push(closes[i] - closes[i - 1]);
    }

    for (let i = 0; i < changes.length; i++) {
      if (i < period - 1) {
        result.push(undefined);
      } else {
        const recentChanges = changes.slice(i - period + 1, i + 1);
        const gains = recentChanges.filter(c => c > 0);
        const losses = recentChanges.filter(c => c < 0).map(c => Math.abs(c));

        const avgGain = gains.length > 0 ? gains.reduce((a, b) => a + b, 0) / period : 0;
        const avgLoss = losses.length > 0 ? losses.reduce((a, b) => a + b, 0) / period : 0;

        if (avgLoss === 0) {
          result.push(100);
        } else {
          const rs = avgGain / avgLoss;
          const rsi = 100 - (100 / (1 + rs));
          result.push(rsi);
        }
      }
    }

    // 最初の値は変化量がないのでundefined
    result.unshift(undefined);

    return result;
  }

  /**
   * 複数ポジション組み合わせの相殺決済ポイントを計算
   */
  calculateOffsetPoints(positions: Position[]): OffsetPoint[] {
    if (positions.length < 2) return [];

    const longPositions = positions.filter(p => p.type === PositionType.LONG);
    const shortPositions = positions.filter(p => p.type === PositionType.SHORT);

    if (longPositions.length === 0 || shortPositions.length === 0) {
      return [];
    }

    const offsetPoints: OffsetPoint[] = [];

    // 全ての組み合わせを生成（買いと売りが混在する組み合わせのみ）
    const longCombinations = this.generateCombinations(longPositions, 1);
    const shortCombinations = this.generateCombinations(shortPositions, 1);

    for (const longs of longCombinations) {
      for (const shorts of shortCombinations) {
        const combined = [...longs, ...shorts];
        const offsetPoint = this.calculateOffsetPrice(combined);
        if (offsetPoint) {
          offsetPoints.push(offsetPoint);
        }
      }
    }

    // 相殺価格で降順ソート
    return offsetPoints.sort((a, b) => b.offsetPrice - a.offsetPrice);
  }

  /**
   * 単一組み合わせの相殺価格を計算
   */
  private calculateOffsetPrice(positions: Position[]): OffsetPoint | null {
    const hasLong = positions.some(p => p.type === PositionType.LONG);
    const hasShort = positions.some(p => p.type === PositionType.SHORT);

    if (!hasLong || !hasShort) return null;

    let totalCost = 0;
    let totalQuantity = 0;

    for (const position of positions) {
      totalCost += position.quantity * position.entryPrice;
      totalQuantity += position.quantity;
    }

    const offsetPrice = totalCost / totalQuantity;

    const longQuantity = positions
      .filter(p => p.type === PositionType.LONG)
      .reduce((sum, p) => sum + p.quantity, 0);

    const shortQuantity = positions
      .filter(p => p.type === PositionType.SHORT)
      .reduce((sum, p) => sum + p.quantity, 0);

    const netQuantity = longQuantity - shortQuantity;

    let direction: 'LONG' | 'SHORT' | 'NEUTRAL';
    if (netQuantity > 0) {
      direction = 'LONG';
    } else if (netQuantity < 0) {
      direction = 'SHORT';
    } else {
      direction = 'NEUTRAL';
    }

    return {
      positions,
      labels: positions.map(p => p.label),
      offsetPrice,
      netQuantity: Math.abs(netQuantity),
      direction
    };
  }

  /**
   * 配列の全組み合わせを生成（minSize個以上）
   */
  private generateCombinations<T>(arr: T[], minSize: number = 1): T[][] {
    const result: T[][] = [];
    const n = arr.length;

    for (let i = 1; i < (1 << n); i++) {
      const combination: T[] = [];
      for (let j = 0; j < n; j++) {
        if (i & (1 << j)) {
          combination.push(arr[j]);
        }
      }
      if (combination.length >= minSize) {
        result.push(combination);
      }
    }

    return result;
  }
}
