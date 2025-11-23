# 株式投資シミュレーション（スマホ版）

Angular 20を使用したスマホ最適化の株式投資シミュレーションアプリケーションです。

## 🎯 プロジェクトの特徴

- **スマホファースト設計**: 2×2の4分割グリッドレイアウト
- **信用取引対応**: 3倍レバレッジ（証拠金30%）
- **両建て取引**: ロング/ショート同時保有
- **相殺決済機能**: 利益になる組み合わせのみ表示、一括決済可能
- **データベース連携**: Firebase Firestoreで自動保存、履歴管理
- **日次データ追跡**: 全期間の日次データを記録（途中終了も対応）
- **CSV/ZIPエクスポート**: 日次データと取引履歴のダウンロード
- **リアルタイム分析**: 投資成績の即時計算と表示
- **987銘柄対応**: プリロードされた株価データから選択可能
- **条件付きスタイリング**: ポジションの損益状況を視覚的に表示（丸/四角）

## 🌐 デモ

https://stock-simulation-ac580.web.app

## 📱 4分割レイアウト

```
┌────────────────────┬───────────────────────────┐
│ 左上エリア         │ 右上エリア                │
│ 資産情報           │ 売買履歴                  │
│ ・現在資産情報      │ ・過去90日分の            │
│ ・相殺決済ポイント  │   取引履歴テーブル        │
│ ・SP決済ボタン      │ ・終値・前日比            │
│                    │ ・売買・損益              │
├────────────────────┼───────────────────────────┤
│ 左下エリア         │ 右下エリア                │
│ 操作パネル         │ ポジション状態            │
│ ・買いボタン        │ ・散布図による            │
│ ・売りボタン        │   ポジション可視化        │
│ ・次の日へ          │ ・現在価格ライン表示      │
│ ・終了              │ ・相殺決済ポイント表示    │
│ ・決済ボタン一覧    │ ・条件付きスタイリング    │
└────────────────────┴───────────────────────────┘
```

## 🚀 クイックスタート

### 前提条件

- Node.js 18以上
- npm 9以上
- Angular CLI 20以上

### インストールと起動

```bash
# リポジトリをクローン
git clone git@github.com:sakurabito7/stackSimulationSmartFon.git
cd stackSimulationSmartFon

# 依存関係をインストール
npm install

# 開発サーバーを起動
npm start

# ブラウザで http://localhost:4200 にアクセス
```

### Firebase Hostingへのデプロイ

```bash
# ビルド
npm run build

# デプロイ
firebase deploy --only hosting
```

## 📦 実装済みの機能

### ✅ データモデル（`src/app/models/`）
- ✅ `position.model.ts` - ポジション管理
- ✅ `trade.model.ts` - 取引記録
- ✅ `stock-data.model.ts` - 株価データ
- ✅ `simulation-config.model.ts` - シミュレーション設定

### ✅ サービス層（`src/app/services/`）
- ✅ `stock-data.service.ts` - CSV読み込み、データ管理
- ✅ `trading.service.ts` - 取引実行、投資成績計算
- ✅ `calculation.service.ts` - テクニカル指標、相殺決済ポイント（利益のみ表示）
- ✅ `database.service.ts` - Firestore連携、シミュレーション履歴管理
- ✅ `export.service.ts` - CSV/ZIPエクスポート（日次データ、取引履歴）

### ✅ コンポーネント（`src/app/components/`）

#### 1. 初期設定画面（`start-config`）
- 987銘柄のドロップダウン選択
- シミュレーション設定入力（開始日、期間、資金、売買単位）
- CSVファイルの動的読み込み

#### 2. メインシミュレーション画面（`simulation`）
- **資産情報パネル**（左上）
  - 現在日付、経過日数、現在価格
  - 現金残高、総資産、損益・損益率
  - 相殺決済ポイント一覧（SP1, SP2...）
  - クリックで一括決済可能

- **売買履歴**（右上）
  - 過去90日分のテーブル表示
  - 日付、終値、前日比
  - 売買情報と損益

- **操作パネル**（左下）- 2列レイアウト
  - 左列: 買い/売りボタン、次の日へ、終了
  - 右列: 決済ボタン一覧（2行表示: ラベル+株数、価格）

- **ポジション状態**（右下）
  - Chart.js散布図によるポジション可視化
  - ロング（青）/ショート（赤）の識別
  - 現在価格ライン表示
  - 相殺決済ポイントライン（オレンジ、利益になる組み合わせのみ）
  - 条件付きスタイリング:
    - 損益プラス: 丸形（●）で表示
    - 損益マイナス: 四角形（■）で表示
    - ±3%超: ポジションに枠表示（買い=青、売り=赤）
    - ±8%超: ラベルが黄色に変化

#### 3. 結果画面（`result`）
- シミュレーション終了時に**自動的にFirestoreに保存**
- 投資成績サマリー（勝率、損益率、期待値など）
- 最大ドローダウン
- 詳細な統計情報
- 売買履歴のCSVエクスポート

#### 4. 履歴画面（`history`）
- 過去のシミュレーション結果一覧
- 個別の日次データCSVダウンロード
- 全シミュレーションの一括ZIPダウンロード
  - summary.csv（全シミュレーション概要）
  - daily_data_001_*.csv（各シミュレーションの日次データ）
  - trades_001_*.csv（各シミュレーションの取引履歴）

### ✅ スタイリング
- レスポンシブデザイン（スマホ最適化）
- 4分割グリッドレイアウト（固定行: 1fr 1fr）
- 仕様書準拠の色定義
- アニメーション無効化（パフォーマンス向上）

## 🔧 技術スタック

| 技術 | バージョン | 用途 |
|------|-----------|------|
| Angular | 20.1.0 | フレームワーク |
| TypeScript | 5.8.2 | 言語 |
| Chart.js | 4.5.1 | チャート描画 |
| ng2-charts | 8.0.0 | Angular用Chart.jsラッパー |
| chartjs-plugin-datalabels | 2.2.0 | データラベル表示 |
| Firebase Firestore | - | データベース（シミュレーション履歴保存） |
| Firebase Hosting | - | ホスティング |
| JSZip | 3.10.1 | ZIP圧縮（一括エクスポート） |
| file-saver | 2.0.5 | ファイルダウンロード |

## 🎨 デザインシステム

### 色定義

```css
:root {
  /* プラス/マイナス表示 */
  --color-profit: #1976D2;    /* 利益 - 青 */
  --color-loss: #D32F2F;      /* 損失 - 赤 */

  /* ポジション種別 */
  --color-long: #2196F3;      /* 買い - 青 */
  --color-short: #f44336;     /* 売り - 赤 */

  /* ハイライト */
  --color-highlight: #2196F3; /* 強調表示 */
}
```

### レイアウトグリッド

```css
.simulation-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;  /* 固定行で縦方向の変形を防止 */
  gap: 8px;
  height: calc(100vh - 120px);
}
```

## 📊 データ形式

### CSVフォーマット

```csv
日付,始値,高値,安値,終値,出来高
2014-01-06,5810,5880,5810,5880,8769100
2014-01-07,5890,5920,5870,5890,7221100
```

CSVファイルは `public/assets/stock-data/` に配置されています。
987銘柄の株価データが含まれています。

## 🧪 開発コマンド

```bash
# 開発サーバー起動
npm start

# ビルド
npm run build

# 本番ビルド
npm run build -- --configuration production

# Firebase デプロイ
firebase deploy --only hosting
```

## 📖 主要機能の使用方法

### 信用取引（証拠金取引）

- 証拠金率: 30%（3倍レバレッジ）
- ロング: 株価上昇で利益
- ショート: 株価下落で利益
- 両建て可能（ロング・ショート同時保有）

### 相殺決済ポイント

- ロング・ショートの全組み合わせを自動生成
- 相殺価格で決済した場合の損益を計算
- **利益になる組み合わせのみ表示**（損失になる組み合わせは非表示）
- 相殺価格 = (Σ 建値 × 数量) / (Σ 数量)
- クリックで該当ポジションを一括決済

### 日次データ追跡

- シミュレーション期間中の**全日分**のデータを記録
- 記録内容: 日付、現金残高、含み損益、総資産、ポジション数、株価
- 途中で終了ボタンを押しても、その時点までの日次データを保存
- Firestoreに自動保存、CSV/ZIPでエクスポート可能

### 散布図の条件付きスタイリング

- **損益による形状変化**:
  - プラス（利益）: 丸形（●）
  - マイナス（損失）: 四角形（■）
- **±3%超**: ポジションに枠を表示
  - 買いポジション: 青枠
  - 売りポジション: 赤枠
- **±8%超**: ラベルが黄色に変化（大きな損益発生）

### 総資産の計算

```
総資産 = 現金残高 + Σ(証拠金 + 含み損益)

証拠金 = ポジション価値 × 30%
含み損益 = (現在価格 - エントリー価格) × 数量  (ロング)
含み損益 = (エントリー価格 - 現在価格) × 数量  (ショート)
```

## 🗂️ プロジェクト構造

```
stock-simulation/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── start-config/      # 初期設定画面
│   │   │   ├── simulation/        # メインシミュレーション画面
│   │   │   ├── result/            # 結果画面
│   │   │   └── history/           # 履歴画面（Firestore連携）
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
│           └── ...
├── firebase.json                  # Firebase設定
├── firestore.rules                # Firestoreセキュリティルール
├── .firebaserc                    # Firebaseプロジェクト
└── package.json
```

## 🔍 主要な実装ポイント

### 1. Y軸の安定化（散布図）

過去3ヶ月の株価範囲を基準にY軸を設定することで、ポジション数が少なくても安定した表示を実現。

```typescript
const recentPrices = this.stockData.slice(threeMonthsAgo, currentDay + 1);
const averagePrice = recentPrices.reduce((sum, p) => sum + p, 0) / recentPrices.length;
```

### 2. 固定レイアウト

`grid-template-rows: 1fr 1fr` により、売買履歴が増えても縦方向のレイアウトが崩れない。

### 3. 条件付きレンダリング

損益率に応じて動的に枠や色を変更：

```typescript
const profitRate = ((currentPrice - entryPrice) / entryPrice) * 100;
if (Math.abs(profitRate) > 3) {
  // 枠を表示
}
if (Math.abs(profitRate) > 8) {
  // ラベルを黄色に
}
```

## 🐛 既知の問題

特になし

## 🤝 コントリビューション

1. このリポジトリをフォーク
2. 機能ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add some amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 📄 ライセンス

このプロジェクトはMITライセンスの下で公開されています。

## 🙏 謝辞

- Angular チーム
- Chart.js コミュニティ
- Firebase チーム

---

**開発状況**: ✅ 完成（2025年11月23日更新）
**デプロイURL**: https://stock-simulation-ac580.web.app
**リポジトリ**: https://github.com/sakurabito7/stackSimulationSmartFon

## 📝 最近の更新（2025年11月23日）

- Firebase Firestoreとの連携実装（シミュレーション履歴の自動保存）
- 日次データ追跡機能（全シミュレーション期間の完全記録）
- 途中終了時も日次データを保存
- CSV/ZIPエクスポート機能（日次データ・取引履歴）
- ポジション表示を損益に応じて丸/四角に変更
- 相殺決済ポイントを利益になる組み合わせのみに限定
- 履歴画面の追加（過去シミュレーション閲覧）
