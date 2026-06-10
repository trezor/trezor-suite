import { createMMKV } from 'react-native-mmkv';

import type { RatesByTimestamps } from '@suite-common/wallet-types';

// Non-encrypted storage for historic fiat rates. Rates are public market data
// so they do not require the encrypted user-data store.
const mmkv = createMMKV({ id: 'trezor-historic-rates-cache' });

const storageKey = (accountKey: string, localCurrency: string) =>
    `v1:${accountKey}:${localCurrency}`;

export const readHistoricRates = (
    accountKey: string,
    localCurrency: string,
): RatesByTimestamps | undefined => {
    const raw = mmkv.getString(storageKey(accountKey, localCurrency));
    if (!raw) return undefined;
    try {
        return JSON.parse(raw) as RatesByTimestamps;
    } catch {
        return undefined;
    }
};

export const writeHistoricRates = (
    accountKey: string,
    localCurrency: string,
    rates: RatesByTimestamps,
): void => {
    mmkv.set(storageKey(accountKey, localCurrency), JSON.stringify(rates));
};
