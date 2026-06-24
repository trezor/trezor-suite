import { type MMKV } from 'react-native-mmkv';

import type { RatesByTimestamps } from '@suite-common/wallet-types';

let mmkv: MMKV | null = null;

// Keys live inside the shared encrypted store — prefix to avoid collision with Redux persist keys.
const KEY_PREFIX = 'historic-rates:v1:';
const storageKey = (localCurrency: string) => `${KEY_PREFIX}${localCurrency}`;

export const initHistoricRatesStorage = (encryptedMmkv: MMKV): void => {
    mmkv = encryptedMmkv;
};

export const readHistoricRates = (localCurrency: string): RatesByTimestamps | undefined => {
    if (!mmkv) return undefined;
    try {
        const raw = mmkv.getString(storageKey(localCurrency));
        if (!raw) return undefined;

        return JSON.parse(raw) as RatesByTimestamps;
    } catch {
        return undefined;
    }
};

export const writeHistoricRates = (localCurrency: string, rates: RatesByTimestamps): void => {
    mmkv?.set(storageKey(localCurrency), JSON.stringify(rates));
};

export const clearHistoricRates = (): void => {
    if (!mmkv) return;
    for (const key of mmkv.getAllKeys()) {
        if (key.startsWith(KEY_PREFIX)) {
            mmkv.delete(key);
        }
    }
};
