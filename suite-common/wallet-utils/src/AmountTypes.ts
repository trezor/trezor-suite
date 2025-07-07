import type { NetworkSymbol } from '@suite-common/wallet-config';
import { Branded } from '@trezor/type-utils';
import { BigNumber } from '@trezor/utils';

/**
 * Bitcoin, Ether, Dogecoin, ...
 */
export type AmountUnit<T extends NetworkSymbol> = BigNumber & Branded<`amount-whole-${T}`>;
export const asAmountUnit = <T extends NetworkSymbol>(value: BigNumber, _symbol: T) =>
    value as unknown as AmountUnit<T>;

/**
 * Sats, ...
 */
export type AmountSubunit<T extends NetworkSymbol> = BigNumber & Branded<`amount-sub-${T}`>;
export const asAmountSubunit = <T extends NetworkSymbol>(value: BigNumber, _symbol: T) =>
    value as unknown as AmountSubunit<T>;
