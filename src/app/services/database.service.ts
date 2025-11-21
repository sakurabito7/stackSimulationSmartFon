import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  query,
  orderBy,
  limit,
  Timestamp
} from '@angular/fire/firestore';
import { SimulationRecord } from '../models/simulation-record.model';
import { SimulationState, SimulationConfig } from '../models/simulation-config.model';

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {

  constructor(private firestore: Firestore) {}

  /**
   * シミュレーション結果をFirestoreに保存
   */
  async saveSimulation(state: SimulationState, config: SimulationConfig, csvFileName: string): Promise<string> {
    const record: SimulationRecord = {
      createdAt: Timestamp.now(),
      config: {
        csvFileName: csvFileName,
        startDate: this.formatDate(config.startDate),
        period: config.period,
        initialCash: config.initialCash,
        tradeAmount: config.tradeAmount,
        maxPositions: config.maxPositions
      },
      summary: {
        finalCash: state.cash,
        totalProfit: state.performance?.totalProfit || 0,
        totalLoss: state.performance?.totalLoss || 0,
        netProfit: (state.performance?.totalProfit || 0) - (state.performance?.totalLoss || 0),
        profitRate: state.performance?.profitRate || 0,
        totalTrades: state.performance?.totalTrades || 0,
        winRate: state.performance?.winRate || 0,
        winTrades: state.performance?.winTrades || 0,
        loseTrades: state.performance?.loseTrades || 0,
        avgProfit: state.performance?.avgProfit || 0,
        avgLoss: state.performance?.avgLoss || 0,
        expectedValue: state.performance?.expectedValue || 0,
        maxDrawdown: state.performance?.maxDrawdown || 0,
        profitFactor: state.performance?.profitFactor || 0
      },
      trades: state.trades,
      dailyData: state.dailyData  // 日次データを保存
    };

    const collectionRef = collection(this.firestore, 'simulations');
    const docRef = await addDoc(collectionRef, record);
    return docRef.id;
  }

  /**
   * 全シミュレーション履歴を取得（最新順）
   */
  async getSimulations(limitCount: number = 100): Promise<SimulationRecord[]> {
    const collectionRef = collection(this.firestore, 'simulations');
    const q = query(collectionRef, orderBy('createdAt', 'desc'), limit(limitCount));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as SimulationRecord));
  }

  /**
   * 特定のシミュレーションを取得
   */
  async getSimulation(id: string): Promise<SimulationRecord | null> {
    const docRef = doc(this.firestore, 'simulations', id);
    const snapshot = await getDoc(docRef);

    if (snapshot.exists()) {
      return {
        id: snapshot.id,
        ...snapshot.data()
      } as SimulationRecord;
    }
    return null;
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
