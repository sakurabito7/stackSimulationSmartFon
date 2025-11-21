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
    const headers = ['日付', '取引種別', '価格', '数量', 'ポジション種別', 'ラベル', '決済', '損益'];
    const rows = trades.map(trade => [
      this.formatDate(trade.date),
      trade.action,
      trade.price.toString(),
      trade.quantity.toString(),
      trade.positionType,
      trade.label,
      trade.isClosing ? '決済' : '新規',
      trade.profit !== undefined ? trade.profit.toString() : ''
    ]);

    return [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
  }

  /**
   * サマリーCSVを生成（全シミュレーションの結果一覧）
   */
  generateSummaryCSV(records: SimulationRecord[]): string {
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

    const rows = records.map(record => [
      this.formatDateTime(record.createdAt),
      record.config.csvFileName,
      record.config.startDate,
      record.config.period.toString(),
      record.config.initialCash.toString(),
      record.summary.finalCash.toString(),
      record.summary.netProfit.toString(),
      record.summary.profitRate.toFixed(2) + '%',
      record.summary.totalTrades.toString(),
      record.summary.winRate.toFixed(2) + '%',
      record.summary.winTrades.toString(),
      record.summary.loseTrades.toString(),
      record.summary.avgProfit.toFixed(0),
      record.summary.avgLoss.toFixed(0),
      record.summary.expectedValue.toFixed(0),
      record.summary.maxDrawdown.toFixed(0),
      record.summary.profitFactor.toFixed(2)
    ]);

    return [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
  }

  /**
   * 単一のシミュレーションCSVをダウンロード
   */
  downloadSingleCSV(record: SimulationRecord): void {
    const csv = this.generateCSV(record.trades);
    const bom = '\uFEFF';
    const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
    const fileName = `simulation_${this.formatDateForFileName(record.createdAt)}.csv`;
    saveAs(blob, fileName);
  }

  /**
   * 複数のシミュレーションをZIPで一括ダウンロード
   */
  async downloadBulkZip(records: SimulationRecord[]): Promise<void> {
    if (records.length === 0) {
      alert('ダウンロードするデータがありません');
      return;
    }

    const zip = new JSZip();

    // サマリーCSVを追加
    const summaryCSV = this.generateSummaryCSV(records);
    zip.file('summary.csv', '\uFEFF' + summaryCSV);

    // 各シミュレーションのCSVを追加
    records.forEach((record, index) => {
      const csv = this.generateCSV(record.trades);
      const fileName = `simulation_${String(index + 1).padStart(3, '0')}_${this.formatDateForFileName(record.createdAt)}.csv`;
      zip.file(fileName, '\uFEFF' + csv);
    });

    // ZIPファイルを生成してダウンロード
    try {
      const blob = await zip.generateAsync({ type: 'blob' });
      const zipFileName = `simulation_history_${this.formatDateForFileName(new Date())}.zip`;
      saveAs(blob, zipFileName);
    } catch (error) {
      console.error('ZIP生成エラー:', error);
      alert('ZIPファイルの生成に失敗しました');
    }
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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
