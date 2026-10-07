import { BigNumber } from '@trezor/utils';

/** Backend amounts come in the coin's smallest unit (satoshi, wei, lamport). */
export const subunitsToUnits = (amount: string, decimals: number): string =>
    new BigNumber(amount || '0').shiftedBy(-decimals).toString(10);
