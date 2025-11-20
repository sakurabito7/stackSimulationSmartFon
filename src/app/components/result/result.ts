import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SimulationState } from '../../models/simulation-config.model';
import { Trade } from '../../models/trade.model';

@Component({
  selector: 'app-result',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './result.html',
  styleUrl: './result.css'
})
export class ResultComponent {
  @Input() state!: SimulationState;
  @Output() restart = new EventEmitter<void>();

  onRestart(): void {
    this.restart.emit();
  }

  // CSVエクスポート
  exportToCSV(): void {
    if (!this.state || !this.state.trades) {
      alert('エクスポートするデータがありません');
      return;
    }

    const headers = ['日付', '取引種別', '価格', '数量', 'ポジション種別', 'ラベル', '決済', '損益'];
    const rows = this.state.trades.map(trade => [
      this.formatDate(trade.date),
      trade.action,
      trade.price.toString(),
      trade.quantity.toString(),
      trade.positionType,
      trade.label,
      trade.isClosing ? '決済' : '新規',
      trade.profit !== undefined ? trade.profit.toString() : ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // BOM付きUTF-8でダウンロード（Excelで開けるように）
    const bom = '\uFEFF';
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `simulation_trades_${this.formatDate(new Date())}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // 勝率計算
  get winRate(): number {
    if (!this.state.performance) return 0;
    return this.state.performance.winRate;
  }

  // 損益率計算
  get totalProfitRate(): number {
    if (!this.state.performance) return 0;
    return this.state.performance.profitRate;
  }
}
