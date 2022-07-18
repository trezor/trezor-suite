import { PROTO } from '@trezor/connect';
import { AppState } from '@suite-types';

export const getLocalCurrency = (localCurrency: string) => ({
    value: localCurrency,
    label: localCurrency.toUpperCase(),
});

export const getAreSatoshisUsed = (state: AppState) =>
    state.wallet.settings.bitcoinAmountUnit === PROTO.AmountUnit.SATOSHI;
