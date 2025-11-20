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
  @Output() start = new EventEmitter<SimulationConfig>();

  csvFile?: File;
  startDate: string = '2014-01-06';
  period: number = 100;
  initialCash: number = 1000000;
  tradeAmount: number = 100000;
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
    } catch (error) {
      this.errorMessage = 'ファイルの読み込みに失敗しました: ' + (error as Error).message;
      this.csvFile = undefined;
      this.selectedPreloadFile = '';
    } finally {
      this.isLoading = false;
    }
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

      this.start.emit(config);
    } catch (error) {
      this.errorMessage = 'CSVファイルの読み込みに失敗しました: ' + (error as Error).message;
      this.isLoading = false;
    }
  }
}
