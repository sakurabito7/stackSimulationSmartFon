import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SimulationConfig, SimulationState } from './models/simulation-config.model';
import { StartConfigComponent } from './components/start-config/start-config';
import { SimulationComponent } from './components/simulation/simulation';
import { ResultComponent } from './components/result/result';
import { HistoryComponent } from './components/history/history';

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

  onStartSimulation(event: { config: SimulationConfig; fileName: string }): void {
    this.config = event.config;
    this.csvFileName = event.fileName;
    this.currentView = 'simulation';
  }

  onFinishSimulation(state: SimulationState): void {
    this.state = state;
    this.currentView = 'result';
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
