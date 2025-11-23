# 株式投資シミュレーション - セットアップガイド

## プロジェクト概要

このプロジェクトは、スマホ用の株式投資シミュレーションWebアプリケーションです。
Firebase Hostingにデプロイされており、987銘柄の実データを使用してリアルな取引シミュレーションが可能です。

### 主な機能
- 4分割グリッドレイアウト（スマホ最適化）
- ロング/ショート両建て取引
- 3倍レバレッジ信用取引（証拠金30%）
- 相殺決済機能（利益になる組み合わせのみ表示、クリックで一括決済）
- **Firebase Firestoreとの連携**（シミュレーション終了時に自動保存）
- **日次データ追跡**（全期間の日次データ記録、途中終了も対応）
- **CSV/ZIPエクスポート**（日次データ、取引履歴）
- 履歴画面（過去シミュレーション閲覧）
- 投資成績分析
- 条件付きスタイリング（損益で丸/四角、±3%枠、±8%黄色ラベル）
- アニメーション無効化（パフォーマンス向上）

## 技術スタック

- **Angular**: 20.1.0
- **TypeScript**: 5.8.2
- **Chart.js**: 4.5.1
- **ng2-charts**: 8.0.0
- **chartjs-plugin-datalabels**: 2.2.0
- **Firebase Firestore**: データベース（シミュレーション履歴保存）
- **Firebase Hosting**: デプロイプラットフォーム
- **JSZip**: 3.10.1（一括エクスポート用）
- **file-saver**: 2.0.5（ファイルダウンロード用）

## セットアップ手順

### 1. リポジトリのクローン

```bash
git clone git@github.com:sakurabito7/stackSimulationSmartFon.git
cd stackSimulationSmartFon
```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. 開発サーバーの起動

```bash
npm start
```

ブラウザで http://localhost:4200 にアクセスしてください。

### 4. ビルド

```bash
npm run build
```

ビルド成果物は `dist/stock-simulation/browser/` に出力されます。

### 5. Firebase Hostingへのデプロイ

```bash
firebase deploy --only hosting
```

デプロイURL: https://stock-simulation-ac580.web.app

## プロジェクト構造

```
stock-simulation/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── start-config/      # 初期設定画面
│   │   │   │   ├── start-config.ts
│   │   │   │   ├── start-config.html
│   │   │   │   └── start-config.css
│   │   │   ├── simulation/        # メインシミュレーション画面
│   │   │   │   ├── simulation.ts
│   │   │   │   ├── simulation.html
│   │   │   │   └── simulation.css
│   │   │   ├── result/            # 結果画面
│   │   │   │   ├── result.ts
│   │   │   │   ├── result.html
│   │   │   │   └── result.css
│   │   │   └── history/           # 履歴画面（Firestore連携）
│   │   │       ├── history.ts
│   │   │       ├── history.html
│   │   │       └── history.css
│   │   ├── models/                # データモデル
│   │   │   ├── position.model.ts
│   │   │   ├── trade.model.ts
│   │   │   ├── stock-data.model.ts
│   │   │   ├── simulation-config.model.ts
│   │   │   └── simulation-record.model.ts  # Firestore用
│   │   ├── services/              # ビジネスロジック
│   │   │   ├── stock-data.service.ts
│   │   │   ├── trading.service.ts
│   │   │   ├── calculation.service.ts
│   │   │   ├── database.service.ts   # Firestore連携
│   │   │   └── export.service.ts     # CSV/ZIPエクスポート
│   │   ├── app.ts                 # ルートコンポーネント
│   │   ├── app.html
│   │   ├── app.css
│   │   └── app.config.ts          # アプリ設定
│   ├── environments/
│   │   └── environment.ts         # Firebase設定
│   ├── styles.css                 # グローバルスタイル
│   └── index.html
├── public/
│   └── assets/
│       └── stock-data/            # 987銘柄のCSVデータ
│           ├── stocks.json        # 銘柄コードリスト
│           ├── 1301.csv
│           ├── 1305.csv
│           └── ... (987ファイル)
├── firebase.json                  # Firebase設定
├── firestore.rules                # Firestoreセキュリティルール
├── .firebaserc                    # Firebaseプロジェクト設定
├── package.json
├── angular.json
├── tsconfig.json
└── README.md
```

## 実装済みの機能

### ✅ データモデル（`src/app/models/`）

#### Position（ポジション）
```typescript
export interface Position {
  id: number;
  type: PositionType;  // LONG | SHORT
  entryDate: Date;
  entryPrice: number;
  quantity: number;
  label: string;
}
```

#### Trade（取引）
```typescript
export interface Trade {
  date: Date;
  action: TradeAction;  // BUY | SELL
  price: number;
  quantity: number;
  positionType: PositionType;
  positionId: number;
  label: string;
  isClosing: boolean;
  profit?: number;
}
```

#### SimulationConfig（シミュレーション設定）
```typescript
export interface SimulationConfig {
  symbol: string;
  startDate: Date;
  period: number;
  initialCash: number;
  tradeAmount: number;
  maxPositions: number;
  csvFile?: File;
}
```

### ✅ サービス層（`src/app/services/`）

#### StockDataService
- CSVファイル読み込み
- 株価データ管理
- 987銘柄対応

#### TradingService
- ポジション開設・決済
- 信用取引（証拠金30%）
- 投資成績計算
- ポートフォリオ評価

#### CalculationService
- 相殺決済ポイント算出（利益になる組み合わせのみ）
- 損益計算による自動フィルタリング
- テクニカル指標計算

#### DatabaseService
- Firebase Firestoreとの連携
- シミュレーション結果の自動保存
- 履歴データの取得・管理
- 日次データの保存

#### ExportService
- 日次データのCSV生成
- 取引履歴のCSV生成
- 複数シミュレーションの一括ZIPダウンロード
- サマリーCSV生成

### ✅ コンポーネント（`src/app/components/`）

#### 1. start-config（初期設定画面）

**機能**:
- 987銘柄のドロップダウン選択
- シミュレーション設定入力
- CSVファイルの動的読み込み

**主要メソッド**:
- `ngOnInit()`: stocks.jsonから銘柄リストを読み込み
- `onPreloadFileSelected()`: 選択された銘柄のCSVを読み込み
- `onSubmit()`: 設定を親コンポーネントに送信

#### 2. simulation（メインシミュレーション画面）

**4つのパネル構成**:

##### 左上: 資産情報パネル
- 現在日付、経過日数
- 現在価格、現金残高
- 総資産、損益・損益率
- 相殺決済ポイント一覧（SP1, SP2...）
  - クリックで該当ポジションを一括決済
  - 現在価格での損益を表示

##### 右上: 売買履歴
- 過去90日分のテーブル表示
- 日付、終値、前日比
- 売買情報と損益
- 現在の日をハイライト表示

##### 左下: 操作パネル（2列レイアウト）
- **左列**:
  - 買いボタン
  - 売りボタン
  - 次の日へボタン（大きめ）
  - 終了ボタン
- **右列**:
  - 決済ボタン一覧（2行表示）
    - 1行目: 買1 100（ラベル+株数）
    - 2行目: 6000（価格）

##### 右下: ポジション状態
- Chart.js散布図によるポジション可視化
- ロング（青）/ショート（赤）の識別
- 現在価格ライン表示（緑、ラインの上にラベル）
- 相殺決済ポイントライン（オレンジ、SP1, SP2...、利益になる組み合わせのみ）
- Y軸: 過去3ヶ月の株価平均を中心に設定
- 条件付きスタイリング:
  - 損益プラス: 丸形（●）で表示
  - 損益マイナス: 四角形（■）で表示
  - ±3%超: ポジションに枠表示（買い=青、売り=赤）
  - ±8%超: ラベルが黄色に変化
- アニメーション無効（`animation: false`）

**主要メソッド**:
- `initializeSimulation()`: シミュレーション初期化
- `openLongPosition()`, `openShortPosition()`: ポジション開設
- `closeLongPosition()`, `closeShortPosition()`: ポジション決済
- `closeOffsetPoint()`: 相殺決済ポイントの一括決済
- `nextDay()`: 日付を進める
- `updateScatterChart()`: 散布図更新
- `calculateOffsetPointProfit()`: 相殺決済ポイントの損益計算

#### 3. result（結果画面）

**表示内容**:
- **シミュレーション終了時に自動的にFirestoreに保存**
- 投資成績サマリー
  - 勝率、損益率
  - 期待値、最大ドローダウン
  - 総取引数、勝ち数、負け数
  - 平均利益、平均損失
  - プロフィットファクター
- 売買履歴のCSVエクスポート

#### 4. history（履歴画面）

**表示内容**:
- 過去のシミュレーション結果一覧
- 各シミュレーションの概要（日時、銘柄、期間、最終資産、利益率など）
- 個別の日次データCSVダウンロード
- 全シミュレーションの一括ZIPダウンロード
  - summary.csv: 全シミュレーションの概要
  - daily_data_001_*.csv: 各シミュレーションの日次データ
  - trades_001_*.csv: 各シミュレーションの取引履歴

**日次データCSVの内容**:
- 日付、現金残高、含み損益、総資産、ポジション数、株価
- シミュレーション期間の全日分を記録
- 途中で終了ボタンを押した場合も、その時点までのデータを保存

### ✅ スタイリング

#### グローバルスタイル（`src/styles.css`）
```css
:root {
  --color-profit: #1976D2;    /* 利益 - 青 */
  --color-loss: #D32F2F;      /* 損失 - 赤 */
  --color-long: #2196F3;      /* 買い - 青 */
  --color-short: #f44336;     /* 売り - 赤 */
  --color-highlight: #2196F3; /* 強調 */
}
```

#### レイアウト
- 4分割グリッド（`grid-template-rows: 1fr 1fr`）
- 固定行で縦方向の変形を防止
- min-height: 0 で overflow 制御
- flexbox による内部レイアウト

## 重要な実装ポイント

### 1. 総資産の正確な計算

```typescript
calculatePortfolioValue(positions: Position[], currentPrice: number): number {
  return positions.reduce((total, position) => {
    const positionValue = position.quantity * position.entryPrice;
    const margin = positionValue / 3; // 預けている証拠金

    let unrealizedPL = 0;
    if (position.type === PositionType.LONG) {
      unrealizedPL = (currentPrice - position.entryPrice) * position.quantity;
    } else {
      unrealizedPL = (position.entryPrice - currentPrice) * position.quantity;
    }

    return total + margin + unrealizedPL;
  }, 0);
}
```

ポイント: 証拠金 + 含み損益を計算することで、売買の瞬間に総資産が変動しない

### 2. Y軸の安定化

```typescript
// 過去3ヶ月の株価データを取得
const threeMonthsAgo = Math.max(0, this.currentDay - 89);
const recentPrices = this.stockData.slice(threeMonthsAgo, this.currentDay + 1);

// 過去3ヶ月の株価平均値を計算（Y軸の中央値）
const averagePrice = recentPrices.reduce((sum, price) => sum + price, 0) / recentPrices.length;
```

ポイント: ポジション価格ではなく、過去3ヶ月の株価範囲を基準にY軸を設定

### 3. 条件付きスタイリング

```typescript
longPositions.forEach(p => {
  const profitRate = ((this.currentPrice - p.entryPrice) / p.entryPrice) * 100;
  const absProfitRate = Math.abs(profitRate);

  // ±3%を超えた場合、青い枠を付ける
  if (absProfitRate > 3) {
    longBorderColors.push('rgba(33, 150, 243, 1)');
    longBorderWidths.push(3);
  }

  // ±8%を超えた場合、ラベルを黄色に
  if (absProfitRate > 8) {
    longLabelColors.push('#FFEB3B');
  }
});
```

### 4. 固定レイアウト

```css
.simulation-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;  /* autoではなく1fr 1frで固定 */
  gap: 8px;
  height: calc(100vh - 120px);
}

.grid-area-info, .grid-area-history,
.grid-area-control, .grid-area-scatter {
  overflow: hidden;
  min-height: 0;  /* overflow制御のために必須 */
  display: flex;
  flex-direction: column;
}
```

## 開発コマンド

```bash
# 開発サーバー起動
npm start

# ビルド
npm run build

# 本番ビルド
npm run build -- --configuration production

# Firebaseデプロイ
firebase deploy --only hosting

# Gitにコミット
git add .
git commit -m "your message"
git push origin master
```

## データの追加方法

### 新しい株価データの追加

1. CSVファイルを `public/assets/stock-data/` に配置
   - ファイル名: `{銘柄コード}.csv`
   - フォーマット: 日付,始値,高値,安値,終値,出来高

2. `public/assets/stock-data/stocks.json` に銘柄コードを追加
   ```json
   [
     "1301",
     "1305",
     ...
     "9999"  // 新しい銘柄コード
   ]
   ```

3. ビルドしてデプロイ

## トラブルシューティング

### Chart.jsが表示されない

`app.config.ts`でChart.jsを登録してください：

```typescript
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

export const appConfig: ApplicationConfig = {
  providers: [
    provideCharts(withDefaultRegisterables()),
    // その他のプロバイダー
  ]
};
```

### レイアウトが崩れる

- `grid-template-rows: 1fr 1fr` が設定されているか確認
- 各グリッドエリアに `min-height: 0` が設定されているか確認
- overflow設定が適切か確認

### 総資産が売買時に変動する

`calculatePortfolioValue()` が証拠金と含み損益の両方を含んでいるか確認：
```typescript
return total + margin + unrealizedPL;
```

### ビルドエラーが発生する

依存関係を再インストール：
```bash
rm -rf node_modules package-lock.json
npm install
```

### Firebaseデプロイでエラー

1. Firebase CLIがインストールされているか確認
   ```bash
   npm install -g firebase-tools
   ```

2. ログインしているか確認
   ```bash
   firebase login
   ```

3. プロジェクトが正しく設定されているか確認
   ```bash
   firebase use --add
   ```

## パフォーマンス最適化

### 実装済みの最適化

1. **アニメーション無効化**
   ```typescript
   scatterChartOptions = {
     animation: false,  // アニメーションを無効化
     ...
   };
   ```

2. **固定レイアウト**
   - `grid-template-rows: 1fr 1fr` で再レイアウトを最小化

3. **データラベルの選択的表示**
   ```typescript
   display: (context: any) => {
     return label !== '現在価格' && !label.startsWith('SP');
   }
   ```

## セキュリティ考慮事項

- CSVファイルは静的アセットとして配信
- ユーザー入力のバリデーション実装済み
- XSS対策としてAngularの組み込み機能を使用

## 参考資料

- [Angular公式ドキュメント](https://angular.dev/)
- [Chart.js公式ドキュメント](https://www.chartjs.org/)
- [ng2-charts GitHub](https://github.com/valor-software/ng2-charts)
- [chartjs-plugin-datalabels](https://chartjs-plugin-datalabels.netlify.app/)
- [Firebase Hosting](https://firebase.google.com/docs/hosting)

## サポート

問題が発生した場合は、GitHubのIssuesで報告してください：
https://github.com/sakurabito7/stackSimulationSmartFon/issues

---

**最終更新**: 2025年11月23日
**バージョン**: 2.0.0
**ステータス**: ✅ 完成・デプロイ済み

## 📝 最近の更新（2025年11月23日）

### 新機能
- **Firebase Firestoreとの連携**: シミュレーション終了時に自動保存
- **日次データ追跡**: 全シミュレーション期間の完全記録
- **途中終了対応**: 終了ボタンを押した時点までの日次データを保存
- **CSV/ZIPエクスポート**: 日次データと取引履歴のダウンロード
- **履歴画面**: 過去シミュレーション閲覧と一括エクスポート

### UI/UX改善
- **ポジション表示**: 損益に応じて丸（利益）/四角（損失）で視覚化
- **相殺決済ポイント**: 利益になる組み合わせのみ表示
- **自動保存**: 結果画面の「保存」ボタンを削除し、自動的にFirestoreに保存
