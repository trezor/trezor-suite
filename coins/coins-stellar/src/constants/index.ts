import { BigNumber } from '@trezor/utils';

export const STELLAR_DECIMALS = 7;

export const BASE_INFO = {
    BASE_RESERVE: new BigNumber(5_000_000), // 0.5 XLM, https://developers.stellar.org/docs/learn/fundamentals/stellar-data-structures/accounts#base-reserves
    MINIMUM_RESERVE: new BigNumber(10_000_000), // 1 XLM
};
