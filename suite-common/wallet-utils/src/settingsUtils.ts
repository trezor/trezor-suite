import { PROTO } from '@trezor/connect';

export const getLocalCurrency = (localCurrency: string) => ({
    value: localCurrency,
    label: localCurrency.toUpperCase(),
});

export const getAreSatoshisUsed = (bitcoinAmountUnit: PROTO.AmountUnit) =>
    bitcoinAmountUnit === PROTO.AmountUnit.SATOSHI;
