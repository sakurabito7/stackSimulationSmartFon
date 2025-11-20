# 株式投資シミュレーション - セットアップガイド

## プロジェクト概要

このプロジェクトは、スマホ用の株式投資シミュレーションWebアプリケーションです。

### 主な機能
- 4分割グリッドレイアウト（スマホ最適化）
- ロング/ショート両建て取引
- 3倍レバレッジ信用取引
- 相殺決済機能
- 投資成績分析

## 技術スタック

- **Angular**: 20.1.0
- **TypeScript**: 5.8.2
- **Chart.js**: 4.5.1
- **ng2-charts**: 8.0.0

## セットアップ手順

### 1. 依存関係のインストール

```bash
cd stock-simulation
npm install
```

### 2. 開発サーバーの起動

```bash
npm start
```

ブラウザで http://localhost:4200 にアクセスしてください。

### 3. ビルド

```bash
npm run build
```

## プロジェクト構造

```
stock-simulation/
├── src/
│   ├── app/
│   │   ├── components/          # UIコンポーネント（実装予定）
│   │   ├── models/              # データモデル（完成）
│   │   │   ├── position.model.ts
│   │   │   ├── trade.model.ts
│   │   │   ├── stock-data.model.ts
│   │   │   └── simulation-config.model.ts
│   │   ├── services/            # ビジネスロジック（完成）
│   │   │   ├── stock-data.service.ts
│   │   │   ├── trading.service.ts
│   │   │   └── calculation.service.ts
│   │   ├── app.ts               # ルートコンポーネント（基本実装完了）
│   │   ├── app.html
│   │   └── app.css
│   ├── styles.css               # グローバルスタイル
│   └── index.html
├── public/
│   └── assets/
│       └── stock-data/          # CSVデータ配置場所
└── package.json
```

## 実装済みの機能

### ✅ データモデル
- Position（ポジション）
- Trade（取引）
- StockData（株価データ）
- SimulationConfig（シミュレーション設定）
- SimulationState（シミュレーション状態）
- PerformanceMetrics（投資成績）

### ✅ サービス層
- **StockDataService**: CSVファイル読み込み、データ管理
- **TradingService**: ポジション管理、取引実行、投資成績計算
- **CalculationService**: テクニカル指標計算、相殺決済ポイント算出

### ✅ ルートコンポーネント
- 画面遷移管理（設定→シミュレーション→結果）
- 基本的なレイアウト

### ✅ スタイリング
- スマホ用4分割グリッドレイアウト
- レスポンシブデザイン
- 色定義（仕様書準拠）

## 次に実装すべきコンポーネント

以下のコンポーネントを実装してください。各コンポーネントのスケルトンと実装例は次のセクションを参照してください。

### 1. 初期設定画面（start-config）

```bash
ng generate component components/start-config --standalone
```

**責務**:
- CSV読み込み
- シミュレーション設定入力
- バリデーション

**Output**:
- `@Output() start: EventEmitter<SimulationConfig>`

### 2. メインシミュレーション画面（simulation）

```bash
ng generate component components/simulation --standalone
```

**責務**:
- 子コンポーネントの統括
- 4分割グリッドレイアウトの実装
- ユーザー操作の処理

**プロパティ**:
- `@Input() config: SimulationConfig`
- `state: SimulationState`

**Output**:
- `@Output() finish: EventEmitter<SimulationState>`

### 3. 資産情報パネル（info-panel）

```bash
ng generate component components/info-panel --standalone
```

**表示内容**:
- 現在日付、経過日数
- 現在価格、現金残高
- 総資産、損益
- ポジション明細（直近5件）
- 相殺決済ポイント

### 4. 操作パネル（control-panel）

```bash
ng generate component components/control-panel --standalone
```

**機能**:
- 買いボタン（プルダウン）
- 売りボタン（プルダウン）
- 次の日へボタン
- 終了ボタン

### 5. 売買履歴（trade-history）

```bash
ng generate component components/trade-history --standalone
```

**表示内容**:
- 過去90日分の履歴テーブル
- 終値、前日比、連続上げ下げ数
- 売買、数量、ラベル、損益

### 6. 散布図（scatter-plot）

```bash
ng generate component components/scatter-plot --standalone
```

**機能**:
- Chart.jsを使用したポジション散布図
- ロング（青）/ショート（赤）の可視化
- 現在価格の表示

### 7. 結果画面（result）

```bash
ng generate component components/result --standalone
```

**表示内容**:
- 投資成績サマリー
- 売買履歴エクスポート

## 実装例：start-configコンポーネント

```typescript
// start-config.ts
import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SimulationConfig } from '../../models/simulation-config.model';
import { StockDataService } from '../../services/stock-data.service';

@Component({
  selector: 'app-start-config',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="config-container">
      <h2>シミュレーション設定</h2>

      <form (ngSubmit)="onSubmit()">
        <div class="form-group">
          <label>CSVファイル</label>
          <input type="file" accept=".csv" (change)="onFileSelected($event)">
        </div>

        <div class="form-group">
          <label>開始日</label>
          <input type="date" [(ngModel)]="startDate" name="startDate" required>
        </div>

        <div class="form-group">
          <label>期間（日数）</label>
          <input type="number" [(ngModel)]="period" name="period" min="1" required>
        </div>

        <div class="form-group">
          <label>初期資金（円）</label>
          <input type="number" [(ngModel)]="initialCash" name="initialCash" min="1" required>
        </div>

        <div class="form-group">
          <label>売買単位（円）</label>
          <input type="number" [(ngModel)]="tradeAmount" name="tradeAmount" min="1" required>
        </div>

        <button type="submit" [disabled]="!csvFile">シミュレーション開始</button>
      </form>
    </div>
  `
})
export class StartConfigComponent {
  @Output() start = new EventEmitter<SimulationConfig>();

  csvFile?: File;
  startDate: string = '2014-01-01';
  period: number = 100;
  initialCash: number = 1000000;
  tradeAmount: number = 100000;

  constructor(private stockDataService: StockDataService) {}

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.csvFile = input.files[0];
    }
  }

  async onSubmit(): Promise<void> {
    if (!this.csvFile) return;

    // CSVデータを読み込み
    await this.stockDataService.loadStockDataFromCSV(this.csvFile);

    const config: SimulationConfig = {
      symbol: this.csvFile.name.replace('.csv', ''),
      startDate: new Date(this.startDate),
      period: this.period,
      initialCash: this.initialCash,
      tradeAmount: this.tradeAmount,
      maxPositions: 5,
      csvFile: this.csvFile
    };

    this.start.emit(config);
  }
}
```

## 4分割グリッドレイアウトの実装例

```css
/* simulation.css */
.simulation-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: auto auto;
  gap: 10px;
  height: calc(100vh - 120px);
}

.grid-area-info {
  grid-area: 1 / 1 / 2 / 2;
  overflow-y: auto;
}

.grid-area-history {
  grid-area: 1 / 2 / 2 / 3;
  overflow-y: auto;
}

.grid-area-control {
  grid-area: 2 / 1 / 3 / 2;
  overflow-y: auto;
}

.grid-area-scatter {
  grid-area: 2 / 2 / 3 / 3;
  overflow-y: auto;
}

@media (max-width: 768px) {
  .simulation-container {
    gap: 5px;
  }
}
```

## Chart.jsの使用例

```typescript
import { Component } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';

@Component({
  selector: 'app-scatter-plot',
  standalone: true,
  imports: [BaseChartDirective],
  template: `
    <canvas baseChart
      [type]="'scatter'"
      [data]="scatterChartData"
      [options]="scatterChartOptions">
    </canvas>
  `
})
export class ScatterPlotComponent {
  scatterChartData: ChartConfiguration['data'] = {
    datasets: [
      {
        label: 'ロング',
        data: [{x: 1, y: 1000}, {x: 2, y: 1050}],
        backgroundColor: 'rgba(54, 162, 235, 0.9)',
        pointRadius: 8
      },
      {
        label: 'ショート',
        data: [{x: 3, y: 1020}],
        backgroundColor: 'rgba(255, 99, 132, 0.9)',
        pointRadius: 8
      }
    ]
  };

  scatterChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: 'linear',
        min: 0,
        max: 5
      },
      y: {
        type: 'linear'
      }
    }
  };
}
```

## サービスの使用例

```typescript
import { TradingService } from '../services/trading.service';

// ロングポジションを開く
this.tradingService.openLongPosition(
  this.state,
  currentPrice,
  currentDate,
  this.config.tradeAmount
);

// ポジションを決済
this.tradingService.closeLongPosition(
  this.state,
  positionId,
  currentPrice,
  currentDate
);

// 評価額を計算
const portfolioValue = this.tradingService.calculatePortfolioValue(
  this.state.positions,
  currentPrice
);
```

## テストデータの準備

`public/assets/stock-data/`フォルダにCSVファイルを配置してください。

**CSVフォーマット**:
```csv
日付,始値,高値,安値,終値,出来高
2014-01-06,5810,5880,5810,5880,8769100
2014-01-07,5890,5920,5870,5890,7221100
```

## トラブルシューティング

### Chart.jsが表示されない

`app.config.ts`で Chart.js を登録してください：

```typescript
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

export const appConfig: ApplicationConfig = {
  providers: [
    provideCharts(withDefaultRegisterables()),
    // その他のプロバイダー
  ]
};
```

### ビルドエラーが発生する

依存関係を再インストールしてください：

```bash
rm -rf node_modules package-lock.json
npm install
```

## 参考資料

- [Angular公式ドキュメント](https://angular.dev/)
- [Chart.js公式ドキュメント](https://www.chartjs.org/)
- [ng2-charts](https://github.com/valor-software/ng2-charts)
- `IMPLEMENTATION-PLAN2.md` - 詳細な実装計画書
- `stock-simulation-spec2.md` - 機能仕様書
