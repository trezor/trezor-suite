import { Branded } from '@trezor/type-utils';
import { BigNumber } from '@trezor/utils';

/**
 * Value in EUR, USD, ... but also it can be in BTC, currently the global BaseCurrency from the Settings is used.
 */
export type BaseCurrencyAmount = BigNumber & Branded<`base-currency-amount`>;
export const asBaseCurrencyAmount = (value: BigNumber) => value as BaseCurrencyAmount;

export const BASE_CURRENCY_ZERO = asBaseCurrencyAmount(new BigNumber(0));
