import { Injectable } from '@angular/core';
import { SimulationConfig, SimulationState, PerformanceMetrics } from '../models/simulation-config.model';
import { Position, ClosedPosition, PositionType } from '../models/position.model';
import { Trade, TradeAction } from '../models/trade.model';

@Injectable({
  providedIn: 'root'
})
export class TradingService {

  /**
   * シミュレーション状態を初期化
   */
  initializeState(config: SimulationConfig): SimulationState {
    return {
      currentDay: 0,
      currentDate: config.startDate,
      cash: config.initialCash,
      positions: [],
      closedPositions: [],
      trades: [],
      nextPositionId: 1,
      nextLongLabel: 1,
      nextShortLabel: 1,
      dailyData: []
    };
  }

  /**
   * 新規ロングポジション（買い）を作成
   */
  openLongPosition(
    state: SimulationState,
    currentPrice: number,
    currentDate: Date,
    tradeAmount: number
  ): void {
    const quantity = Math.floor(tradeAmount / currentPrice);
    const totalCost = quantity * currentPrice;

    // 信用取引: 証拠金（建玉の1/3）を差し引き
    const margin = totalCost / 3;

    if (state.cash < margin) {
      throw new Error('証拠金が不足しています');
    }

    // 連番でラベルを付与（決済済みも含めて一意）
    const longLabel = state.nextLongLabel++;

    const position: Position = {
      id: state.nextPositionId++,
      type: PositionType.LONG,
      entryDate: currentDate,
      entryPrice: currentPrice,
      quantity: quantity,
      label: `買い${longLabel}`
    };

    state.cash -= margin;
    state.positions.push(position);

    const trade: Trade = {
      date: currentDate,
      action: TradeAction.BUY,
      price: currentPrice,
      quantity: quantity,
      positionType: PositionType.LONG,
      positionId: position.id,
      label: position.label,
      isClosing: false
    };

    state.trades.push(trade);
  }

  /**
   * 新規ショートポジション（売り）を作成
   */
  openShortPosition(
    state: SimulationState,
    currentPrice: number,
    currentDate: Date,
    tradeAmount: number
  ): void {
    const quantity = Math.floor(tradeAmount / currentPrice);
    const totalValue = quantity * currentPrice;

    // 信用取引: 証拠金（建玉の1/3）を差し引き
    const margin = totalValue / 3;

    if (state.cash < margin) {
      throw new Error('証拠金が不足しています');
    }

    // 連番でラベルを付与（決済済みも含めて一意）
    const shortLabel = state.nextShortLabel++;

    const position: Position = {
      id: state.nextPositionId++,
      type: PositionType.SHORT,
      entryDate: currentDate,
      entryPrice: currentPrice,
      quantity: quantity,
      label: `売り${shortLabel}`
    };

    state.cash -= margin;
    state.positions.push(position);

    const trade: Trade = {
      date: currentDate,
      action: TradeAction.SELL,
      price: currentPrice,
      quantity: quantity,
      positionType: PositionType.SHORT,
      positionId: position.id,
      label: position.label,
      isClosing: false
    };

    state.trades.push(trade);
  }

  /**
   * ロングポジションを決済（売却）
   */
  closeLongPosition(
    state: SimulationState,
    positionId: number,
    currentPrice: number,
    currentDate: Date
  ): void {
    const positionIndex = state.positions.findIndex(p => p.id === positionId);
    if (positionIndex === -1) return;

    const position = state.positions[positionIndex];
    const totalCost = position.quantity * position.entryPrice;
    const totalValue = position.quantity * currentPrice;

    const profit = totalValue - totalCost;
    const profitRate = (profit / totalCost) * 100;

    // 証拠金返還 + 損益
    const margin = totalCost / 3;
    state.cash += margin + profit;

    const closedPosition: ClosedPosition = {
      ...position,
      exitDate: currentDate,
      exitPrice: currentPrice,
      profit: profit,
      profitRate: profitRate
    };

    state.positions.splice(positionIndex, 1);
    state.closedPositions.push(closedPosition);

    const trade: Trade = {
      date: currentDate,
      action: TradeAction.SELL,
      price: currentPrice,
      quantity: position.quantity,
      positionType: PositionType.LONG,
      positionId: position.id,
      label: position.label,
      isClosing: true,
      profit: profit
    };

    state.trades.push(trade);
  }

  /**
   * ショートポジションを決済（買戻し）
   */
  closeShortPosition(
    state: SimulationState,
    positionId: number,
    currentPrice: number,
    currentDate: Date
  ): void {
    const positionIndex = state.positions.findIndex(p => p.id === positionId);
    if (positionIndex === -1) return;

    const position = state.positions[positionIndex];
    const totalSellValue = position.quantity * position.entryPrice;
    const totalBuyValue = position.quantity * currentPrice;

    const profit = totalSellValue - totalBuyValue;
    const profitRate = (profit / totalSellValue) * 100;

    // 証拠金返還 + 損益
    const margin = totalSellValue / 3;
    state.cash += margin + profit;

    const closedPosition: ClosedPosition = {
      ...position,
      exitDate: currentDate,
      exitPrice: currentPrice,
      profit: profit,
      profitRate: profitRate
    };

    state.positions.splice(positionIndex, 1);
    state.closedPositions.push(closedPosition);

    const trade: Trade = {
      date: currentDate,
      action: TradeAction.BUY,
      price: currentPrice,
      quantity: position.quantity,
      positionType: PositionType.SHORT,
      positionId: position.id,
      label: position.label,
      isClosing: true,
      profit: profit
    };

    state.trades.push(trade);
  }

  /**
   * ポジションの評価額を計算（預けている証拠金 + 含み損益）
   */
  calculatePortfolioValue(positions: Position[], currentPrice: number): number {
    return positions.reduce((total, position) => {
      const positionValue = position.quantity * position.entryPrice;
      const margin = positionValue / 3; // 預けている証拠金

      let unrealizedPL = 0;
      if (position.type === PositionType.LONG) {
        // ロング: (現在価格 - 建値) × 数量
        unrealizedPL = (currentPrice - position.entryPrice) * position.quantity;
      } else {
        // ショート: (建値 - 現在価格) × 数量
        unrealizedPL = (position.entryPrice - currentPrice) * position.quantity;
      }

      return total + margin + unrealizedPL;
    }, 0);
  }

  /**
   * 投資成績を計算
   */
  calculatePerformanceMetrics(closedPositions: ClosedPosition[], initialCash: number): PerformanceMetrics {
    const totalTrades = closedPositions.length;
    const winTrades = closedPositions.filter(p => p.profit > 0).length;
    const loseTrades = closedPositions.filter(p => p.profit < 0).length;

    const totalProfit = closedPositions
      .filter(p => p.profit > 0)
      .reduce((sum, p) => sum + p.profit, 0);

    const totalLoss = Math.abs(closedPositions
      .filter(p => p.profit < 0)
      .reduce((sum, p) => sum + p.profit, 0));

    const winRate = totalTrades > 0 ? (winTrades / totalTrades) * 100 : 0;
    const avgProfit = winTrades > 0 ? totalProfit / winTrades : 0;
    const avgLoss = loseTrades > 0 ? totalLoss / loseTrades : 0;
    const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : 0;

    const netProfit = totalProfit - totalLoss;
    const profitRate = (netProfit / initialCash) * 100;
    const expectedValue = totalTrades > 0 ? netProfit / totalTrades : 0;

    const maxDrawdown = this.calculateMaxDrawdown(closedPositions);

    return {
      winRate,
      profitRate,
      expectedValue,
      maxDrawdown,
      totalTrades,
      winTrades,
      loseTrades,
      avgProfit,
      avgLoss,
      profitFactor,
      totalProfit,
      totalLoss
    };
  }

  /**
   * 最大ドローダウンを計算
   */
  private calculateMaxDrawdown(closedPositions: ClosedPosition[]): number {
    let maxDrawdown = 0;
    let peak = 0;
    let cumulative = 0;

    for (const position of closedPositions) {
      cumulative += position.profit;
      if (cumulative > peak) {
        peak = cumulative;
      }
      const drawdown = peak - cumulative;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }

    return maxDrawdown;
  }
}
