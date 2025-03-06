import type { NetworkSymbol } from '@suite-common/wallet-config';
import { Nominal, NominalA2 } from '@trezor/type-utils';
import { BigNumber } from '@trezor/utils';

import { getAccountDecimals } from './accountUtils';

export type Amount<T extends NetworkSymbol> = BigNumber & Nominal<T>;
export const asAmount = <T extends NetworkSymbol>(amount: string | BigNumber) =>
    new BigNumber(amount) as Amount<T>;

export type AmountSats<T extends NetworkSymbol> = BigNumber & NominalA2<'sats', Amount<T>>;
export const asAmountSats = <T extends NetworkSymbol>(amount: Amount<T>) =>
    amount as unknown as AmountSats<T>;

export type AmountBase<T extends NetworkSymbol> = BigNumber & NominalA2<'base', Amount<T>>; // Todo : `base` us probably terrible naming as Sats are technically th base unit of bitcoin
export const asAmountBase = <T extends NetworkSymbol>(amount: Amount<T>) =>
    amount as unknown as AmountBase<T>;

export const toAmountSats = <T extends NetworkSymbol>(amount: AmountBase<T>): AmountSats<T> => {
    const decimals = getAccountDecimals(amount.__type2.__type);

    const factor = new BigNumber(10).exponentiatedBy(decimals);

    return amount.div(factor) as AmountSats<T>;
};

export const toAmountBase = <T extends NetworkSymbol>(amount: AmountSats<T>): AmountBase<T> => {
    const decimals = getAccountDecimals(amount.__type2.__type);

    const factor = new BigNumber(10).exponentiatedBy(decimals);

    return amount.multipliedBy(factor) as AmountBase<T>;
};
