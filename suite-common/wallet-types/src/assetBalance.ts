import { type BaseCurrencyAmount } from './baseCurrency';

export type AssetBalance = {
    cryptoAmount: string;
    fiatAmount: BaseCurrencyAmount | null;
};
