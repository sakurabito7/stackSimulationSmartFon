import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SimulationConfig } from '../../models/simulation-config.model';
import { StockDataService } from '../../services/stock-data.service';

@Component({
  selector: 'app-start-config',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './start-config.html',
  styleUrl: './start-config.css'
})
export class StartConfigComponent implements OnInit {
  @Output() start = new EventEmitter<{ config: SimulationConfig; fileName: string }>();
  @Output() showHistory = new EventEmitter<void>();

  csvFile?: File;
  startDate: string = '2014-01-06';
  period: number = 365;
  initialCash: number = 1000000;
  tradeAmount: number = 200000;  // 初期資金の1/5
  maxPositions: number = 5;
  isLoading: boolean = false;
  errorMessage: string = '';
  useSampleData: boolean = false;
  selectedPreloadFile: string = '';

  // プリロードファイルリスト
  preloadFiles: { value: string; label: string }[] = [
    { value: '', label: 'ファイルを選択してください' }
  ];

  constructor(private stockDataService: StockDataService) {}

  async ngOnInit(): Promise<void> {
    // JSONから銘柄リストを読み込む
    try {
      const response = await fetch('/assets/stock-data/stocks.json');
      if (response.ok) {
        const stockCodes: string[] = await response.json();
        // 銘柄コードでソート済みのリストを追加
        this.preloadFiles = [
          { value: '', label: 'ファイルを選択してください' },
          ...stockCodes.map(code => ({
            value: `${code}.csv`,
            label: `銘柄コード: ${code}`
          }))
        ];
      }
    } catch (error) {
      console.error('株価データリストの読み込みに失敗しました:', error);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.csvFile = input.files[0];
      this.useSampleData = false;
      this.selectedPreloadFile = '';
      this.errorMessage = '';
    }
  }

  // プルダウンから選択
  async onPreloadFileSelected(): Promise<void> {
    if (!this.selectedPreloadFile) {
      this.csvFile = undefined;
      this.useSampleData = false;
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    try {
      const response = await fetch(`/assets/stock-data/${this.selectedPreloadFile}`);
      if (!response.ok) {
        throw new Error('ファイルの読み込みに失敗しました');
      }
      const text = await response.text();
      const blob = new Blob([text], { type: 'text/csv' });
      this.csvFile = new File([blob], this.selectedPreloadFile, { type: 'text/csv' });
      this.useSampleData = true;
      this.errorMessage = '';

      // CSVを読み込んで日付範囲を取得
      await this.stockDataService.loadStockDataFromCSV(this.csvFile);
      const allData = this.stockDataService.getAllData();

      if (allData.length > 0) {
        // ランダムな開始日を設定
        this.setRandomStartDate(allData);
      }
    } catch (error) {
      this.errorMessage = 'ファイルの読み込みに失敗しました: ' + (error as Error).message;
      this.csvFile = undefined;
      this.selectedPreloadFile = '';
    } finally {
      this.isLoading = false;
    }
  }

  // ランダムな開始日を設定
  private setRandomStartDate(stockData: any[]): void {
    const firstDate = new Date(stockData[0].date);
    const lastDate = new Date(stockData[stockData.length - 1].date);
    const today = new Date();

    // 10年前の日付
    const tenYearsAgo = new Date(today);
    tenYearsAgo.setFullYear(today.getFullYear() - 10);

    // 5年前の日付
    const fiveYearsAgo = new Date(today);
    fiveYearsAgo.setFullYear(today.getFullYear() - 5);

    let candidateStartDate: Date;
    let candidateEndDate: Date;

    // データの最初の日付が10年前以前かチェック
    if (firstDate.getTime() <= tenYearsAgo.getTime()) {
      // 10年前以前のデータがある場合
      candidateStartDate = firstDate;
      candidateEndDate = new Date(Math.min(tenYearsAgo.getTime(), lastDate.getTime()));
    } else if (firstDate.getTime() <= fiveYearsAgo.getTime()) {
      // 5年前以前のデータがある場合
      candidateStartDate = firstDate;
      candidateEndDate = new Date(Math.min(fiveYearsAgo.getTime(), lastDate.getTime()));
    } else {
      // 5年前以前のデータがない場合は、最初から利用可能な範囲で選択
      candidateStartDate = firstDate;
      candidateEndDate = lastDate;
    }

    // 期間分のデータが確保できる範囲でランダムに選択
    const periodMillis = this.period * 24 * 60 * 60 * 1000;
    const adjustedEndDate = new Date(Math.min(
      candidateEndDate.getTime(),
      lastDate.getTime() - periodMillis
    ));

    if (adjustedEndDate.getTime() < candidateStartDate.getTime()) {
      // 期間分のデータが確保できない場合は最初の日付を使用
      this.startDate = this.formatDate(firstDate);
    } else {
      // ランダムな日付を選択
      const randomTime = candidateStartDate.getTime() +
        Math.random() * (adjustedEndDate.getTime() - candidateStartDate.getTime());
      const randomDate = new Date(randomTime);

      // データが存在する最も近い日付を探す
      const closestData = stockData.find(d => new Date(d.date).getTime() >= randomDate.getTime());
      if (closestData) {
        this.startDate = this.formatDate(new Date(closestData.date));
      } else {
        this.startDate = this.formatDate(firstDate);
      }
    }
  }

  // 日付をYYYY-MM-DD形式にフォーマット
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // 初期資金が変更されたときに売買単位を更新
  onInitialCashChange(): void {
    this.tradeAmount = Math.floor(this.initialCash / 5);
  }

  // サンプルデータを使用
  async loadSampleData(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = '';

    try {
      const response = await fetch('/assets/stock-data/sample.csv');
      if (!response.ok) {
        throw new Error('サンプルデータの読み込みに失敗しました');
      }
      const text = await response.text();
      const blob = new Blob([text], { type: 'text/csv' });
      this.csvFile = new File([blob], 'sample.csv', { type: 'text/csv' });
      this.useSampleData = true;
      this.errorMessage = '';
      this.isLoading = false;
    } catch (error) {
      this.errorMessage = 'サンプルデータの読み込みに失敗しました: ' + (error as Error).message;
      this.isLoading = false;
    }
  }

  async onSubmit(): Promise<void> {
    if (!this.csvFile) {
      this.errorMessage = 'CSVファイルを選択してください';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    try {
      // CSVデータを読み込み
      await this.stockDataService.loadStockDataFromCSV(this.csvFile);

      const config: SimulationConfig = {
        symbol: this.csvFile.name.replace('.csv', ''),
        startDate: new Date(this.startDate),
        period: this.period,
        initialCash: this.initialCash,
        tradeAmount: this.tradeAmount,
        maxPositions: this.maxPositions,
        csvFile: this.csvFile
      };

      this.start.emit({ config, fileName: this.csvFile.name });
    } catch (error) {
      this.errorMessage = 'CSVファイルの読み込みに失敗しました: ' + (error as Error).message;
      this.isLoading = false;
    }
  }
}
