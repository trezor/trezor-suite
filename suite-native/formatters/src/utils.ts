import { type Branded } from '@trezor/type-utils';
import { BigNumber } from '@trezor/utils';

// A token amount guaranteed to be in decimal units, not base units. Token formatters accept only this.
export type DecimalTokenAmount = string & Branded<'DecimalTokenAmount'>;

// Base units → decimal.
export const convertTokenValueToDecimal = (
    value: string | number,
    decimals: number,
): DecimalTokenAmount =>
    BigNumber(value).div(BigNumber(10).exponentiatedBy(decimals)).toString() as DecimalTokenAmount;

// For values already in decimal units.
export const asDecimalTokenAmount = (value: string | number): DecimalTokenAmount =>
    value.toString() as DecimalTokenAmount;
