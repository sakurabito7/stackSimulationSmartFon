import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SimulationConfig, SimulationState } from './models/simulation-config.model';
import { StartConfigComponent } from './components/start-config/start-config';
import { SimulationComponent } from './components/simulation/simulation';
import { ResultComponent } from './components/result/result';
import { HistoryComponent } from './components/history/history';
import { DatabaseService } from './services/database.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, StartConfigComponent, SimulationComponent, ResultComponent, HistoryComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  currentView: 'config' | 'simulation' | 'result' | 'history' = 'config';
  config?: SimulationConfig;
  state?: SimulationState;
  csvFileName: string = '';

  constructor(private databaseService: DatabaseService) {}

  onStartSimulation(event: { config: SimulationConfig; fileName: string }): void {
    this.config = event.config;
    this.csvFileName = event.fileName;
    this.currentView = 'simulation';
  }

  async onFinishSimulation(state: SimulationState): Promise<void> {
    this.state = state;
    this.currentView = 'result';

    // シミュレーション終了時に自動的にFirestoreに保存
    if (this.config) {
      try {
        await this.databaseService.saveSimulation(state, this.config, this.csvFileName);
        console.log('シミュレーション結果を自動保存しました');
      } catch (error) {
        console.error('自動保存エラー:', error);
        // エラーが発生しても結果画面は表示する
      }
    }
  }

  retry(): void {
    // 同じ条件でシミュレーションを再開
    if (this.config) {
      this.state = undefined;
      this.currentView = 'simulation';
    }
  }

  restart(): void {
    this.currentView = 'config';
    this.config = undefined;
    this.state = undefined;
    this.csvFileName = '';
  }

  showHistory(): void {
    this.currentView = 'history';
  }

  backFromHistory(): void {
    this.currentView = 'config';
  }
}
