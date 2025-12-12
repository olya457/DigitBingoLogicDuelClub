import AsyncStorage from '@react-native-async-storage/async-storage';

export type RecordEntry = {
  id: string;               
  mode: 'solo' | 'duel';
  tries: number;          
  timeSec: number;         
  createdAt: number;      
};

const KEY = 'digit_bingo_records_v1';

export async function addRecord(entry: RecordEntry) {
  try {
    const raw = (await AsyncStorage.getItem(KEY)) || '[]';
    const list: RecordEntry[] = JSON.parse(raw);
    list.unshift(entry);
    const trimmed = list.slice(0, 100); 
    await AsyncStorage.setItem(KEY, JSON.stringify(trimmed));
  } catch {}
}

export async function getRecords(): Promise<RecordEntry[]> {
  try {
    const raw = (await AsyncStorage.getItem(KEY)) || '[]';
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function clearRecords() {
  try { await AsyncStorage.removeItem(KEY); } catch {}
}
