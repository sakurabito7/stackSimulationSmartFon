import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { SimulationConfig, SimulationState } from '../../models/simulation-config.model';
import { StockData, ChartData } from '../../models/stock-data.model';
import { Position } from '../../models/position.model';
import { StockDataService } from '../../services/stock-data.service';
import { TradingService } from '../../services/trading.service';
import { CalculationService, OffsetPoint } from '../../services/calculation.service';

@Component({
  selector: 'app-simulation',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './simulation.html',
  styleUrl: './simulation.css'
})
export class SimulationComponent implements OnInit, OnChanges {
  @Input() config!: SimulationConfig;
  @Output() finish = new EventEmitter<SimulationState>();

  state!: SimulationState;
  stockData: StockData[] = [];
  chartData: ChartData[] = [];
  currentDay: number = 0;
  currentPrice: number = 0;
  currentDate: Date = new Date();
  offsetPoints: OffsetPoint[] = [];

  // 売買履歴表示用（過去90日分）
  historyData: any[] = [];

  // 散布図データ
  scatterChartData: ChartConfiguration['data'] = {
    datasets: []
  };

  scatterChartPlugins = [ChartDataLabels];

  scatterChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return context.dataset.label + ': ' + context.parsed.y + '円';
          }
        }
      },
      datalabels: {
        display: (context: any) => {
          const label = context.dataset.label;

          // 相殺決済ポイントラインには表示しない
          if (label.startsWith('SP')) return false;

          // 現在価格の場合は右端のみ表示
          if (label === '現在価格') {
            return context.dataIndex === 1; // 右端のポイントのみ
          }

          // ポジションは常に表示
          return true;
        },
        formatter: (value: any, context: any) => {
          return context.dataset.labels ? context.dataset.labels[context.dataIndex] : '';
        },
        color: (context: any) => {
          // 現在価格は緑色
          if (context.dataset.label === '現在価格') {
            return 'rgba(76, 175, 80, 1)';
          }
          // 各データポイントのlabelColorsが設定されている場合はそれを使用
          if (context.dataset.labelColors && context.dataset.labelColors[context.dataIndex]) {
            return context.dataset.labelColors[context.dataIndex];
          }
          return '#fff';
        },
        font: (context: any) => {
          // 現在価格は少し小さめのフォント
          if (context.dataset.label === '現在価格') {
            return {
              weight: 'bold',
              size: 10
            };
          }
          return {
            weight: 'bold',
            size: 11
          };
        },
        anchor: (context: any) => {
          // 現在価格はラインの上に配置
          if (context.dataset.label === '現在価格') {
            return 'start';
          }
          return 'center';
        },
        align: (context: any) => {
          // 現在価格は上方向に配置
          if (context.dataset.label === '現在価格') {
            return 'top';
          }
          return 'center';
        },
        offset: (context: any) => {
          // 現在価格はラインから少し離す
          if (context.dataset.label === '現在価格') {
            return 8;
          }
          return 0;
        }
      }
    },
    scales: {
      x: {
        type: 'linear',
        title: {
          display: true,
          text: 'ポジション'
        },
        min: 0,
        ticks: {
          display: false
        }
      },
      y: {
        type: 'linear',
        title: {
          display: false
        },
        ticks: {
          callback: function(value: any) {
            return Math.floor(value).toLocaleString();
          }
        }
      }
    }
  };

  constructor(
    private stockDataService: StockDataService,
    private tradingService: TradingService,
    private calculationService: CalculationService
  ) {}

  ngOnInit(): void {
    this.initializeSimulation();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // configが変更されたら再初期化
    if (changes['config'] && !changes['config'].firstChange) {
      this.initializeSimulation();
    }
  }

  private initializeSimulation(): void {
    // 全ての変数を初期化
    this.currentDay = 0;
    this.currentPrice = 0;
    this.currentDate = new Date();
    this.offsetPoints = [];
    this.historyData = [];
    this.scatterChartData = { datasets: [] };
    this.stockData = [];
    this.chartData = [];
    // 株価データを取得
    this.stockData = this.stockDataService.getStockData();

    // 開始日のインデックスを見つける
    const startIndex = this.stockData.findIndex(
      d => d.date >= this.config.startDate
    );

    if (startIndex === -1) {
      throw new Error('指定された開始日のデータが見つかりません');
    }

    this.currentDay = startIndex;

    // シミュレーション状態を初期化
    this.state = this.tradingService.initializeState(this.config);

    // チャートデータを計算（テクニカル指標含む）
    this.chartData = this.calculationService.calculateChartData(
      this.stockData,
      this.currentDay
    );

    // 散布図の軸範囲を初期化
    if (this.scatterChartOptions && this.scatterChartOptions.scales) {
      if (this.scatterChartOptions.scales['x']) {
        this.scatterChartOptions.scales['x'].max = undefined;
      }
      if (this.scatterChartOptions.scales['y']) {
        this.scatterChartOptions.scales['y'].min = undefined;
        this.scatterChartOptions.scales['y'].max = undefined;
      }
    }

    // 初期データを設定
    this.updateCurrentData();

    // 初日の日次データを記録
    this.recordDailyData();
  }

  private updateCurrentData(): void {
    const data = this.stockData[this.currentDay];
    this.currentPrice = data.close;
    this.currentDate = data.date;

    // 相殺決済ポイントを更新
    this.offsetPoints = this.calculationService.calculateOffsetPoints(
      this.state.positions
    );

    // 売買履歴データを更新（過去90日分）
    this.updateHistoryData();

    // 散布図を更新
    this.updateScatterChart();
  }

  private updateHistoryData(): void {
    const startIdx = Math.max(0, this.currentDay - 89);
    const endIdx = this.currentDay + 1;

    const historyItems = this.stockData.slice(startIdx, endIdx).map((data, idx) => {
      const absoluteIdx = startIdx + idx;

      // 日付の比較を日付部分のみで行う（時刻を無視）
      const dataDateStr = this.getDateString(data.date);
      const trades = this.state.trades.filter(t => {
        const tradeDateStr = this.getDateString(t.date);
        return tradeDateStr === dataDateStr;
      });

      // 前日比計算
      const prevPrice = absoluteIdx > 0 ? this.stockData[absoluteIdx - 1].close : data.close;
      const priceDiff = data.close - prevPrice;
      const priceChangeRate = ((priceDiff / prevPrice) * 100);

      return {
        date: data.date,
        close: data.close,
        priceDiff,
        priceChangeRate,
        trades
      };
    });

    // 新しい順（最新が上）に並び替え
    this.historyData = historyItems.reverse();
  }

  // 日付を YYYY-MM-DD 形式の文字列に変換
  getDateString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // ラベルから数字を抽出（例: "買い1" → "1", "売り2" → "2"）
  extractNumber(label: string): string {
    const match = label.match(/\d+/);
    return match ? match[0] : '';
  }

  // ロングポジション開設
  openLongPosition(amount: number): void {
    try {
      this.tradingService.openLongPosition(
        this.state,
        this.currentPrice,
        this.currentDate,
        amount
      );
      this.updateCurrentData();
    } catch (error) {
      alert((error as Error).message);
    }
  }

  // ショートポジション開設
  openShortPosition(amount: number): void {
    try {
      this.tradingService.openShortPosition(
        this.state,
        this.currentPrice,
        this.currentDate,
        amount
      );
      this.updateCurrentData();
    } catch (error) {
      alert((error as Error).message);
    }
  }

  // ロングポジション決済
  closeLongPosition(positionId: number): void {
    try {
      this.tradingService.closeLongPosition(
        this.state,
        positionId,
        this.currentPrice,
        this.currentDate
      );
      this.updateCurrentData();
    } catch (error) {
      alert((error as Error).message);
    }
  }

  // ショートポジション決済
  closeShortPosition(positionId: number): void {
    try {
      this.tradingService.closeShortPosition(
        this.state,
        positionId,
        this.currentPrice,
        this.currentDate
      );
      this.updateCurrentData();
    } catch (error) {
      alert((error as Error).message);
    }
  }

  // 相殺決済ポイントをクリックして該当ポジションを決済
  closeOffsetPoint(offsetPoint: OffsetPoint): void {
    try {
      // 該当するポジションを全て決済
      offsetPoint.positions.forEach(position => {
        if (position.type === 'LONG') {
          this.tradingService.closeLongPosition(
            this.state,
            position.id,
            this.currentPrice,
            this.currentDate
          );
        } else {
          this.tradingService.closeShortPosition(
            this.state,
            position.id,
            this.currentPrice,
            this.currentDate
          );
        }
      });
      this.updateCurrentData();
    } catch (error) {
      alert((error as Error).message);
    }
  }

  // 相殺決済ポイントの損益を計算
  calculateOffsetPointProfit(offsetPoint: OffsetPoint): number {
    return offsetPoint.positions.reduce((total, position) => {
      let profit = 0;
      if (position.type === 'LONG') {
        // ロング: (現在価格 - 建値) × 数量
        profit = (this.currentPrice - position.entryPrice) * position.quantity;
      } else {
        // ショート: (建値 - 現在価格) × 数量
        profit = (position.entryPrice - this.currentPrice) * position.quantity;
      }
      return total + profit;
    }, 0);
  }

  // 次の日へ進む
  nextDay(): void {
    if (this.currentDay >= this.stockData.length - 1) {
      alert('データの最終日に到達しました');
      return;
    }

    if (this.state.currentDay >= this.config.period - 1) {
      alert('設定された期間が終了しました');
      this.finishSimulation();
      return;
    }

    this.currentDay++;
    this.state.currentDay++;

    // 信用取引の6ヶ月チェック（自動精算）
    this.checkAndForceCloseExpiredPositions();

    // 証拠金維持率チェック
    this.checkMarginMaintenance();

    this.updateCurrentData();

    // 新しい日のデータを記録（重複チェック付き）
    this.recordDailyData();
  }

  // 期限切れポジションの強制決済（6ヶ月）
  private checkAndForceCloseExpiredPositions(): void {
    const sixMonthsInDays = 180;
    const positionsToClose = this.state.positions.filter(p => {
      const daysSinceEntry = Math.floor(
        (this.currentDate.getTime() - p.entryDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysSinceEntry >= sixMonthsInDays;
    });

    positionsToClose.forEach(p => {
      if (p.type === 'LONG') {
        this.tradingService.closeLongPosition(this.state, p.id, this.currentPrice, this.currentDate);
      } else {
        this.tradingService.closeShortPosition(this.state, p.id, this.currentPrice, this.currentDate);
      }
    });

    if (positionsToClose.length > 0) {
      alert(`${positionsToClose.length}件のポジションが6ヶ月経過のため自動決済されました`);
    }
  }

  // 証拠金維持率チェック
  private checkMarginMaintenance(): void {
    const portfolioValue = this.tradingService.calculatePortfolioValue(
      this.state.positions,
      this.currentPrice
    );
    const totalAssets = this.state.cash + portfolioValue;

    // 必要証拠金の計算
    const requiredMargin = this.state.positions.reduce((sum, p) => {
      const positionValue = p.quantity * this.currentPrice;
      return sum + (positionValue / 3); // 3倍レバレッジなので1/3
    }, 0);

    if (requiredMargin > 0) {
      const maintenanceRate = (totalAssets / requiredMargin) * 100;

      if (maintenanceRate < 20) {
        alert('証拠金維持率が20%を下回りました！追加証拠金が必要です');
      } else if (maintenanceRate < 30) {
        alert('証拠金維持率が30%を下回りました！警告レベルです');
      }
    }
  }

  // 日次データを記録
  private recordDailyData(): void {
    // 既に同じ日付が記録されているかチェック（重複防止）
    const lastRecord = this.state.dailyData[this.state.dailyData.length - 1];
    if (lastRecord && this.getDateString(lastRecord.date) === this.getDateString(this.currentDate)) {
      // 既に記録済みの場合はスキップ
      return;
    }

    const unrealizedProfit = this.tradingService.calculatePortfolioValue(
      this.state.positions,
      this.currentPrice
    );
    const totalValue = this.state.cash + unrealizedProfit;

    this.state.dailyData.push({
      date: new Date(this.currentDate),
      cash: this.state.cash,
      unrealizedProfit: unrealizedProfit,
      totalValue: totalValue,
      positionCount: this.state.positions.length,
      currentPrice: this.currentPrice
    });
  }

  // シミュレーション終了
  finishSimulation(): void {
    // 最終日の日次データを記録
    this.recordDailyData();

    // すべてのポジションを決済
    const remainingPositions = [...this.state.positions];
    remainingPositions.forEach(p => {
      if (p.type === 'LONG') {
        this.tradingService.closeLongPosition(this.state, p.id, this.currentPrice, this.currentDate);
      } else {
        this.tradingService.closeShortPosition(this.state, p.id, this.currentPrice, this.currentDate);
      }
    });

    // 投資成績を計算
    this.state.performance = this.tradingService.calculatePerformanceMetrics(
      this.state.closedPositions,
      this.config.initialCash
    );

    this.finish.emit(this.state);
  }

  // 総資産を取得
  get totalAssets(): number {
    const portfolioValue = this.tradingService.calculatePortfolioValue(
      this.state.positions,
      this.currentPrice
    );
    return this.state.cash + portfolioValue;
  }

  // 損益を取得
  get profitLoss(): number {
    return this.totalAssets - this.config.initialCash;
  }

  // 損益率を取得
  get profitLossRate(): number {
    return (this.profitLoss / this.config.initialCash) * 100;
  }

  // 散布図を更新
  private updateScatterChart(): void {
    const longPositions = this.state.positions.filter(p => p.type === 'LONG');
    const shortPositions = this.state.positions.filter(p => p.type === 'SHORT');

    const datasets: any[] = [];

    // ロングポジション
    if (longPositions.length > 0) {
      // 各ポジションの損益率を計算して枠とラベル色を決定
      const longBorderColors: string[] = [];
      const longBorderWidths: number[] = [];
      const longLabelColors: string[] = [];

      longPositions.forEach(p => {
        // 損益率を計算
        const profitRate = ((this.currentPrice - p.entryPrice) / p.entryPrice) * 100;
        const absProfitRate = Math.abs(profitRate);

        // ±3%を超えた場合、青い枠を付ける
        if (absProfitRate > 3) {
          longBorderColors.push('rgba(33, 150, 243, 1)'); // 青
          longBorderWidths.push(3);
        } else {
          longBorderColors.push('rgba(33, 150, 243, 1)');
          longBorderWidths.push(0);
        }

        // ±8%を超えた場合、ラベルを黄色に
        if (absProfitRate > 8) {
          longLabelColors.push('#FFEB3B'); // 黄色
        } else {
          longLabelColors.push('#FFFFFF'); // 白
        }
      });

      datasets.push({
        label: 'ロング',
        data: longPositions.map((p, idx) => ({
          x: idx + 1,
          y: p.entryPrice
        })),
        labels: longPositions.map(p => this.extractNumber(p.label)),
        labelColors: longLabelColors,
        backgroundColor: 'rgba(33, 150, 243, 0.8)',
        borderColor: longBorderColors,
        pointBorderColor: longBorderColors,
        pointBorderWidth: longBorderWidths,
        pointRadius: 10,
        pointHoverRadius: 12
      });
    }

    // ショートポジション
    if (shortPositions.length > 0) {
      // 各ポジションの損益率を計算して枠とラベル色を決定
      const shortBorderColors: string[] = [];
      const shortBorderWidths: number[] = [];
      const shortLabelColors: string[] = [];

      shortPositions.forEach(p => {
        // 損益率を計算
        const profitRate = ((p.entryPrice - this.currentPrice) / p.entryPrice) * 100;
        const absProfitRate = Math.abs(profitRate);

        // ±3%を超えた場合、赤い枠を付ける
        if (absProfitRate > 3) {
          shortBorderColors.push('rgba(244, 67, 54, 1)'); // 赤
          shortBorderWidths.push(3);
        } else {
          shortBorderColors.push('rgba(244, 67, 54, 1)');
          shortBorderWidths.push(0);
        }

        // ±8%を超えた場合、ラベルを黄色に
        if (absProfitRate > 8) {
          shortLabelColors.push('#FFEB3B'); // 黄色
        } else {
          shortLabelColors.push('#FFFFFF'); // 白
        }
      });

      datasets.push({
        label: 'ショート',
        data: shortPositions.map((p, idx) => ({
          x: longPositions.length + idx + 1,
          y: p.entryPrice
        })),
        labels: shortPositions.map(p => this.extractNumber(p.label)),
        labelColors: shortLabelColors,
        backgroundColor: 'rgba(244, 67, 54, 0.8)',
        borderColor: shortBorderColors,
        pointBorderColor: shortBorderColors,
        pointBorderWidth: shortBorderWidths,
        pointRadius: 10,
        pointHoverRadius: 12
      });
    }

    // 現在価格ライン
    const maxX = Math.max(longPositions.length + shortPositions.length, 5);
    datasets.push({
      label: '現在価格',
      data: [
        { x: 0, y: this.currentPrice },
        { x: maxX, y: this.currentPrice }
      ],
      labels: ['', `${Math.floor(this.currentPrice).toLocaleString()}円`],
      type: 'line',
      borderColor: 'rgba(76, 175, 80, 1)',
      borderWidth: 2,
      borderDash: [5, 5],
      pointRadius: 0,
      fill: false
    });

    // 相殺決済ポイントライン（全て表示）
    this.offsetPoints.forEach((point, idx) => {
      datasets.push({
        label: `SP${idx + 1}`,
        data: [
          { x: 0, y: point.offsetPrice },
          { x: maxX, y: point.offsetPrice }
        ],
        type: 'line',
        borderColor: 'rgba(255, 152, 0, 1)', // オレンジ色
        borderWidth: 2,
        borderDash: [3, 3],
        pointRadius: 0,
        fill: false
      });
    });

    this.scatterChartData = {
      datasets: datasets
    };

    // 過去3ヶ月（90日）の株価データを取得
    const threeMonthsAgo = Math.max(0, this.currentDay - 89);
    const recentPrices = this.stockData.slice(threeMonthsAgo, this.currentDay + 1).map(d => d.close);

    // 過去3ヶ月の株価平均値を計算（Y軸の中央値）
    const averagePrice = recentPrices.reduce((sum, price) => sum + price, 0) / recentPrices.length;

    // 過去3ヶ月の株価の最大値・最小値を計算
    const recentMaxPrice = Math.max(...recentPrices);
    const recentMinPrice = Math.min(...recentPrices);
    const recentPriceRange = recentMaxPrice - recentMinPrice;

    // 過去3ヶ月の価格範囲を基準に、中央値からの距離を決定
    let rangeFromCenter = recentPriceRange / 2;

    // ポジションや相殺決済ポイントが範囲外にある場合は範囲を拡大
    const allPrices: number[] = [this.currentPrice];
    longPositions.forEach(p => allPrices.push(p.entryPrice));
    shortPositions.forEach(p => allPrices.push(p.entryPrice));
    this.offsetPoints.forEach(point => allPrices.push(point.offsetPrice));

    if (allPrices.length > 0) {
      const minPrice = Math.min(...allPrices);
      const maxPrice = Math.max(...allPrices);

      // ポジション等が範囲外にある場合は範囲を拡大
      const maxDistanceFromCenter = Math.max(
        Math.abs(maxPrice - averagePrice),
        Math.abs(minPrice - averagePrice)
      );

      // 過去3ヶ月の範囲とポジション範囲の大きい方を採用
      rangeFromCenter = Math.max(rangeFromCenter, maxDistanceFromCenter);
    }

    // 10%のマージンを追加
    const margin = rangeFromCenter * 0.1;
    const yMin = averagePrice - (rangeFromCenter + margin);
    const yMax = averagePrice + (rangeFromCenter + margin);

    // Y軸の範囲を更新
    if (this.scatterChartOptions && this.scatterChartOptions.scales && this.scatterChartOptions.scales['y']) {
      this.scatterChartOptions.scales['y'].min = yMin;
      this.scatterChartOptions.scales['y'].max = yMax;
    }

    // X軸の範囲を更新
    if (this.scatterChartOptions && this.scatterChartOptions.scales && this.scatterChartOptions.scales['x']) {
      this.scatterChartOptions.scales['x'].max = maxX + 1;
    }
  }
}
