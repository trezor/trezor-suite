import { type Branded } from '@trezor/type-utils';
import { BigNumber } from '@trezor/utils';

/**
 * Value in EUR, USD, ... but also it can be in BTC, currently the global BaseCurrency from the Settings is used.
 * In case of BTC this also can contain value converted to Sats. // Todo: Consider to separate those situations.
 */
export type BaseCurrencyAmount = BigNumber & Branded<`base-currency-amount`>;
export const asBaseCurrencyAmount = (value: BigNumber) => value as BaseCurrencyAmount;

/**
 * Bitcoin, Ether, Dogecoin, ...
 */
export type AmountUnit = BigNumber & Branded<`AmountUnit`>;
const asAmountUnit = (value: BigNumber) => value as AmountUnit;

export const AMOUNT_UNIT_ZERO = asAmountUnit(new BigNumber(0));

/**
 * Sats, ...
 */
export type AmountSubunit = BigNumber & Branded<`AmountSubunit`>;
const asAmountSubunit = (value: BigNumber) => value as AmountSubunit;

export const baseCurrencyAmountToAmountUnit = (value: BaseCurrencyAmount): AmountUnit =>
    asAmountUnit(value);

export const amountUnitToBaseCurrencyAmount = (value: AmountUnit): BaseCurrencyAmount =>
    asBaseCurrencyAmount(value);

export const toAmountUnit = (value: BigNumber): AmountUnit => asAmountUnit(value);

export const toAmountSubunit = (value: BigNumber): AmountSubunit => asAmountSubunit(value);
