import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SimulationConfig, SimulationState } from './models/simulation-config.model';
import { StartConfigComponent } from './components/start-config/start-config';
import { SimulationComponent } from './components/simulation/simulation';
import { ResultComponent } from './components/result/result';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, StartConfigComponent, SimulationComponent, ResultComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  currentView: 'config' | 'simulation' | 'result' = 'config';
  config?: SimulationConfig;
  state?: SimulationState;

  onStartSimulation(config: SimulationConfig): void {
    this.config = config;
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
  }
}
