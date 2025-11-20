import { Injectable } from '@angular/core';
import { StockData } from '../models/stock-data.model';

@Injectable({
  providedIn: 'root'
})
export class StockDataService {
  private stockData: StockData[] = [];

  /**
   * CSVファイルを読み込み、StockData配列に変換
   */
  async loadStockDataFromCSV(file: File): Promise<StockData[]> {
    const text = await file.text();
    const lines = text.split('\n');

    const data: StockData[] = [];

    // ヘッダー行をスキップ
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const [dateStr, openStr, highStr, lowStr, closeStr, volumeStr] = line.split(',');

      data.push({
        date: this.parseDate(dateStr),
        open: parseFloat(openStr),
        high: parseFloat(highStr),
        low: parseFloat(lowStr),
        close: parseFloat(closeStr),
        volume: parseInt(volumeStr)
      });
    }

    // 日付でソート（古い順）
    data.sort((a, b) => a.date.getTime() - b.date.getTime());

    this.stockData = data;
    return data;
  }

  /**
   * 指定開始日から指定日数分のデータを取得
   */
  getDataByPeriod(startDate: Date, days: number): StockData[] {
    const startIndex = this.stockData.findIndex(d =>
      d.date.getTime() >= startDate.getTime()
    );

    if (startIndex === -1) return [];

    return this.stockData.slice(startIndex, startIndex + days);
  }

  /**
   * チャート表示用：開始日の指定日数前からデータを取得
   */
  getDataWithPreload(startDate: Date, simulationDays: number, preloadDays: number): StockData[] {
    const startIndex = this.stockData.findIndex(d =>
      d.date.getTime() >= startDate.getTime()
    );

    if (startIndex === -1) return [];

    const actualStartIndex = Math.max(0, startIndex - preloadDays);
    return this.stockData.slice(actualStartIndex, startIndex + simulationDays);
  }

  /**
   * 全データを取得
   */
  getAllData(): StockData[] {
    return this.stockData;
  }

  /**
   * 株価データを取得（getAllDataのエイリアス）
   */
  getStockData(): StockData[] {
    return this.stockData;
  }

  /**
   * キャッシュクリア
   */
  clearCache(): void {
    this.stockData = [];
  }

  /**
   * 日付文字列の解析（YYYY-MM-DD または YYYY/MM/DD 形式）
   */
  private parseDate(dateStr: string): Date {
    const normalized = dateStr.replace(/\//g, '-');
    return new Date(normalized);
  }
}
