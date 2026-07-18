// Stellar types from stellar-sdk
// https://github.com/stellar/js-stellar-base

import type { stellarGetAddress } from './stellarGetAddress';
import type { stellarSignTransaction } from './stellarSignTransaction';

// Stellar-specific operations
export interface TrezorConnectStellar {
    stellarGetAddress: typeof stellarGetAddress;
    stellarSignTransaction: typeof stellarSignTransaction;
}
