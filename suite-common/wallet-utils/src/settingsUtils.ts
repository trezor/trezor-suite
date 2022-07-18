import { PROTO } from '@trezor/connect';
import { AppState } from '@suite-types';

export const getLocalCurrency = (localCurrency: string) => ({
    value: localCurrency,
    label: localCurrency.toUpperCase(),
});

export const getAreSatoshisUsed = (settings: AppState['wallet']['settings']) =>
    settings.bitcoinAmountUnit === PROTO.AmountUnit.SATOSHI;
