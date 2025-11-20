# 株式投資シミュレーション（スマホ版）

Angular 20を使用したスマホ最適化の株式投資シミュレーションアプリケーションです。

## 🎯 プロジェクトの特徴

- **スマホファースト設計**: 2×2の4分割グリッドレイアウト
- **信用取引対応**: 3倍レバレッジ、6ヶ月自動精算
- **両建て取引**: ロング/ショート同時保有
- **相殺決済機能**: 複数ポジションの最適な決済ポイント表示
- **リアルタイム分析**: 投資成績の即時計算と表示

## 📱 4分割レイアウト

```
┌────────────────────┬───────────────────────────┐
│ 左上エリア         │ 右上エリア                │
│ 資産情報           │ 売買履歴                  │
│ ・現在資産情報      │ ・過去90日分の            │
│ ・信用取引情報      │   取引履歴テーブル        │
│ ・ポジション明細    │ ・終値・前日比            │
│ ・相殺決済ポイント  │ ・売買・損益              │
├────────────────────┼───────────────────────────┤
│ 左下エリア         │ 右下エリア                │
│ 操作パネル         │ 散布図                    │
│ ・買いボタン        │ ・ポジション可視化        │
│ ・売りボタン        │ ・現在価格表示            │
│ ・次の日へ          │ ・ロング/ショート         │
│ ・その他操作        │   識別表示                │
└────────────────────┴───────────────────────────┘
```

## 🚀 クイックスタート

### 前提条件

- Node.js 18以上
- npm 9以上
- Angular CLI 20以上

### インストールと起動

```bash
# プロジェクトディレクトリに移動
cd stock-simulation

# 依存関係をインストール
npm install

# 開発サーバーを起動
npm start

# ブラウザで http://localhost:4200 にアクセス
```

## 📦 現在の実装状況

### ✅ 完成している機能

#### データモデル（`src/app/models/`）
- ✅ `position.model.ts` - ポジション管理
- ✅ `trade.model.ts` - 取引記録
- ✅ `stock-data.model.ts` - 株価データ
- ✅ `simulation-config.model.ts` - シミュレーション設定

#### サービス層（`src/app/services/`）
- ✅ `stock-data.service.ts` - CSV読み込み、データ管理
- ✅ `trading.service.ts` - 取引実行、投資成績計算
- ✅ `calculation.service.ts` - テクニカル指標、相殺決済ポイント

#### 基本構造
- ✅ ルートコンポーネント（`app.ts`）
- ✅ グローバルスタイル（仕様書準拠の色定義）
- ✅ レスポンシブデザイン基盤

### 🚧 実装が必要なコンポーネント

以下のコンポーネントを実装してください。詳細は `SETUP.md` を参照してください。

1. **初期設定画面**（`start-config`）
   - CSVファイル読み込み
   - シミュレーション設定入力

2. **メインシミュレーション画面**（`simulation`）
   - 4分割グリッドレイアウトの統括
   - 子コンポーネントの管理

3. **資産情報パネル**（`info-panel`）
   - 資産状況表示
   - ポジション明細
   - 相殺決済ポイント

4. **操作パネル**（`control-panel`）
   - 売買ボタン（プルダウン）
   - 日付進行、終了ボタン

5. **売買履歴**（`trade-history`）
   - 過去90日分のテーブル表示
   - 終値、前日比、連続上げ下げ数

6. **散布図**（`scatter-plot`）
   - Chart.jsによるポジション可視化
   - ロング/ショートの識別表示

7. **結果画面**（`result`）
   - 投資成績サマリー
   - 履歴エクスポート

## 📚 ドキュメント

- **SETUP.md** - セットアップガイドと実装例
- **IMPLEMENTATION-PLAN2.md** - 詳細な実装計画書
- **stock-simulation-spec2.md** - 機能仕様書

## 🔧 技術スタック

| 技術 | バージョン | 用途 |
|------|-----------|------|
| Angular | 20.1.0 | フレームワーク |
| TypeScript | 5.8.2 | 言語 |
| Chart.js | 4.5.1 | チャート描画 |
| ng2-charts | 8.0.0 | Angular用Chart.jsラッパー |
| chartjs-chart-financial | 0.2.1 | 金融チャート拡張 |

## 🎨 デザインシステム

### 色定義

```css
:root {
  --color-profit: #1976D2;    /* 利益 - 青 */
  --color-loss: #D32F2F;      /* 損失 - 赤 */
  --color-long: #2196F3;      /* ロング - 青 */
  --color-short: #f44336;     /* ショート - 赤 */
}
```

### レイアウトグリッド

```css
.simulation-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: auto auto;
  gap: 10px;
}
```

## 📊 データ形式

### CSVフォーマット

```csv
日付,始値,高値,安値,終値,出来高
2014-01-06,5810,5880,5810,5880,8769100
2014-01-07,5890,5920,5870,5890,7221100
```

CSVファイルは `public/assets/stock-data/` に配置してください。

## 🧪 開発コマンド

```bash
# 開発サーバー起動
npm start

# ビルド
npm run build

# 本番ビルド
npm run build -- --configuration production

# コンポーネント生成
ng generate component components/your-component --standalone
```

## 📖 使用例

### サービスの利用

```typescript
import { TradingService } from './services/trading.service';
import { StockDataService } from './services/stock-data.service';

// 株価データ読み込み
const stockData = await this.stockDataService.loadStockDataFromCSV(file);

// ロングポジション開設
this.tradingService.openLongPosition(
  state,
  currentPrice,
  currentDate,
  tradeAmount
);

// ポジション決済
this.tradingService.closeLongPosition(
  state,
  positionId,
  currentPrice,
  currentDate
);
```

## 🤝 次のステップ

1. `SETUP.md` を読んで実装ガイドを確認
2. コンポーネントを順次作成（start-config → simulation → その他）
3. サービスを活用してビジネスロジックを実装
4. Chart.jsを統合して散布図を実装
5. スタイルを調整してスマホ最適化を完成

---

**注**: このプロジェクトは現在開発中です。基本構造とサービス層は完成していますが、UIコンポーネントの実装が必要です。詳細は `SETUP.md` を参照してください。
