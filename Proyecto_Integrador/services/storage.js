import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const PREFIX = 'sga_';

export async function setStoredItem(key, value) {
  if (Platform.OS === 'web') {
    localStorage.setItem(`${PREFIX}${key}`, value);
    return;
  }
  await SecureStore.setItemAsync(`${PREFIX}${key}`, value);
}

export async function getStoredItem(key) {
  if (Platform.OS === 'web') return localStorage.getItem(`${PREFIX}${key}`);
  return SecureStore.getItemAsync(`${PREFIX}${key}`);
}

export async function removeStoredItem(key) {
  if (Platform.OS === 'web') {
    localStorage.removeItem(`${PREFIX}${key}`);
    return;
  }
  await SecureStore.deleteItemAsync(`${PREFIX}${key}`);
}
