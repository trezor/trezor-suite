import BN from 'bignumber.js';

export const BigNumber = BN.clone({
    // Set to the maximum value to avoid scientific notation
    EXPONENTIAL_AT: 1e9,
});

export type BigNumber = BN;
export type BigNumberValue = BN.Value;
