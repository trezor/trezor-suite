import { type Branded } from '@trezor/type-utils';
import { BigNumber } from '@trezor/utils';

/**
 * Bitcoin, Ether, Dogecoin, ...
 */
export type AmountUnit = BigNumber & Branded<`AmountUnit`>;
export const asAmountUnit = (value: BigNumber) => value as AmountUnit;

export const AMOUNT_UNIT_ZERO = asAmountUnit(new BigNumber(0));

/**
 * Sats, ...
 */
export type AmountSubunit = BigNumber & Branded<`AmountSubunit`>;
export const asAmountSubunit = (value: BigNumber) => value as AmountSubunit;
