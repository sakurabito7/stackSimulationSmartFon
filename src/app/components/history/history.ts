import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DatabaseService } from '../../services/database.service';
import { ExportService } from '../../services/export.service';
import { SimulationRecord } from '../../models/simulation-record.model';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './history.html',
  styleUrl: './history.css'
})
export class HistoryComponent implements OnInit {
  @Output() viewDetail = new EventEmitter<SimulationRecord>();
  @Output() back = new EventEmitter<void>();

  records: SimulationRecord[] = [];
  isLoading = false;
  errorMessage = '';
  isDownloading = false;

  constructor(
    private databaseService: DatabaseService,
    private exportService: ExportService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadHistory();
  }

  async loadHistory(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = '';

    try {
      this.records = await this.databaseService.getSimulations(100);
    } catch (error) {
      console.error('履歴読み込みエラー:', error);
      this.errorMessage = '履歴の読み込みに失敗しました';
    } finally {
      this.isLoading = false;
    }
  }

  // 個別CSVダウンロード
  downloadCSV(record: SimulationRecord): void {
    this.exportService.downloadSingleCSV(record);
  }

  // 一括ZIPダウンロード
  async downloadBulk(): Promise<void> {
    if (this.records.length === 0) {
      alert('ダウンロードするデータがありません');
      return;
    }

    this.isDownloading = true;
    try {
      await this.exportService.downloadBulkZip(this.records);
    } catch (error) {
      console.error('一括ダウンロードエラー:', error);
      alert('一括ダウンロードに失敗しました');
    } finally {
      this.isDownloading = false;
    }
  }

  // 詳細表示
  onViewDetail(record: SimulationRecord): void {
    this.viewDetail.emit(record);
  }

  // 戻る
  onBack(): void {
    this.back.emit();
  }

  // 日時フォーマット
  formatDateTime(date: any): string {
    const d = date.toDate ? date.toDate() : new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  }

  // 利益色判定
  isProfitable(netProfit: number): boolean {
    return netProfit > 0;
  }
}
