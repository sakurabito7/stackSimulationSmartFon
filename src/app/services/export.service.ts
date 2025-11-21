import { Injectable } from '@angular/core';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { SimulationRecord } from '../models/simulation-record.model';
import { Trade } from '../models/trade.model';

@Injectable({
  providedIn: 'root'
})
export class ExportService {

  /**
   * 取引履歴をCSV形式に変換
   */
  generateCSV(trades: Trade[]): string {
    try {
      const headers = ['日付', '取引種別', '価格', '数量', 'ポジション種別', 'ラベル', '決済', '損益'];
      const rows = trades.map(trade => [
        this.formatTradeDate(trade.date),
        trade.action || '',
        trade.price?.toString() || '0',
        trade.quantity?.toString() || '0',
        trade.positionType || '',
        trade.label || '',
        trade.isClosing ? '決済' : '新規',
        trade.profit !== undefined ? trade.profit.toString() : ''
      ]);

      return [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');
    } catch (error) {
      console.error('CSV生成エラー:', error);
      throw error;
    }
  }

  /**
   * サマリーCSVを生成（全シミュレーションの結果一覧）
   */
  generateSummaryCSV(records: SimulationRecord[]): string {
    try {
      const headers = [
        '日時',
        'CSVファイル',
        '開始日',
        '期間',
        '初期資金',
        '最終資産',
        '純損益',
        '利益率',
        '取引回数',
        '勝率',
        '勝ちトレード',
        '負けトレード',
        '平均利益',
        '平均損失',
        '期待値',
        '最大DD',
        'PF'
      ];

      const rows = records.map(record => {
        try {
          return [
            this.formatDateTime(record.createdAt),
            record.config?.csvFileName || '',
            record.config?.startDate || '',
            record.config?.period?.toString() || '0',
            record.config?.initialCash?.toString() || '0',
            record.summary?.finalCash?.toString() || '0',
            record.summary?.netProfit?.toString() || '0',
            (record.summary?.profitRate?.toFixed(2) || '0') + '%',
            record.summary?.totalTrades?.toString() || '0',
            (record.summary?.winRate?.toFixed(2) || '0') + '%',
            record.summary?.winTrades?.toString() || '0',
            record.summary?.loseTrades?.toString() || '0',
            record.summary?.avgProfit?.toFixed(0) || '0',
            record.summary?.avgLoss?.toFixed(0) || '0',
            record.summary?.expectedValue?.toFixed(0) || '0',
            record.summary?.maxDrawdown?.toFixed(0) || '0',
            record.summary?.profitFactor?.toFixed(2) || '0'
          ];
        } catch (error) {
          console.error('レコード処理エラー:', error, record);
          return Array(headers.length).fill('エラー');
        }
      });

      return [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');
    } catch (error) {
      console.error('サマリーCSV生成エラー:', error);
      throw error;
    }
  }

  /**
   * 単一のシミュレーションCSVをダウンロード
   */
  downloadSingleCSV(record: SimulationRecord): void {
    try {
      console.log('CSVダウンロード開始:', record);
      const csv = this.generateCSV(record.trades);
      const bom = '\uFEFF';
      const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
      const fileName = `simulation_${this.formatDateForFileName(record.createdAt)}.csv`;
      saveAs(blob, fileName);
      console.log('CSVダウンロード完了:', fileName);
    } catch (error) {
      console.error('CSVダウンロードエラー:', error);
      alert('CSVダウンロードに失敗しました: ' + (error as Error).message);
    }
  }

  /**
   * 複数のシミュレーションをZIPで一括ダウンロード
   */
  async downloadBulkZip(records: SimulationRecord[]): Promise<void> {
    try {
      console.log('一括ダウンロード開始:', records.length, '件');

      if (records.length === 0) {
        alert('ダウンロードするデータがありません');
        return;
      }

      const zip = new JSZip();

      // サマリーCSVを追加
      try {
        const summaryCSV = this.generateSummaryCSV(records);
        zip.file('summary.csv', '\uFEFF' + summaryCSV);
        console.log('サマリーCSV追加完了');
      } catch (error) {
        console.error('サマリーCSV生成エラー:', error);
        throw new Error('サマリーCSVの生成に失敗しました');
      }

      // 各シミュレーションのCSVを追加
      records.forEach((record, index) => {
        try {
          console.log(`シミュレーション ${index + 1} 処理中...`);
          const csv = this.generateCSV(record.trades);
          const fileName = `simulation_${String(index + 1).padStart(3, '0')}_${this.formatDateForFileName(record.createdAt)}.csv`;
          zip.file(fileName, '\uFEFF' + csv);
        } catch (error) {
          console.error(`シミュレーション ${index + 1} CSV生成エラー:`, error);
          // エラーがあっても続行
        }
      });

      // ZIPファイルを生成してダウンロード
      console.log('ZIP生成開始...');
      const blob = await zip.generateAsync({ type: 'blob' });
      const zipFileName = `simulation_history_${this.formatDateForFileName(new Date())}.zip`;
      saveAs(blob, zipFileName);
      console.log('一括ダウンロード完了:', zipFileName);
    } catch (error) {
      console.error('一括ダウンロードエラー:', error);
      alert('一括ダウンロードに失敗しました: ' + (error as Error).message);
      throw error;
    }
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private formatTradeDate(date: any): string {
    try {
      // Firestore Timestamp、Date、または文字列を処理
      let d: Date;

      if (!date) {
        return '';
      }

      if (date.toDate && typeof date.toDate === 'function') {
        // Firestore Timestamp
        d = date.toDate();
      } else if (date instanceof Date) {
        // Date オブジェクト
        d = date;
      } else if (typeof date === 'string') {
        // 文字列
        d = new Date(date);
      } else if (date.seconds) {
        // Timestamp形式のオブジェクト
        d = new Date(date.seconds * 1000);
      } else {
        console.warn('不明な日付形式:', date);
        return String(date);
      }

      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error('日付フォーマットエラー:', error, date);
      return String(date);
    }
  }

  private formatDateTime(date: Date | any): string {
    // Firestore Timestampの場合はDateに変換
    const d = date.toDate ? date.toDate() : new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  }

  private formatDateForFileName(date: Date | any): string {
    const d = date.toDate ? date.toDate() : new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}_${hours}${minutes}${seconds}`;
  }
}
