import { type Branded } from '@trezor/type-utils';
import { type BigNumber } from '@trezor/utils';

/**
 * Value in EUR, USD, ... but also it can be in BTC, currently the global BaseCurrency from the Settings is used.
 * In case of BTC this also can contain value converted to Sats. // Todo: Consider to separate those situations.
 */
export type BaseCurrencyAmount = BigNumber & Branded<`base-currency-amount`>;
export const asBaseCurrencyAmount = (value: BigNumber) => value as BaseCurrencyAmount;
