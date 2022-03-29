// TODO: docs

import type { AccountBalanceHistoryParams } from '@trezor/blockchain-link/lib/types/params'; // TODO: export from B-L
import type { AccountBalanceHistory } from '@trezor/blockchain-link/lib/types/common'; // TODO: export from B-L
import type { BlockchainParams, Response } from '../params';

export declare function blockchainGetAccountBalanceHistory(
    params: BlockchainParams & AccountBalanceHistoryParams,
): Response<AccountBalanceHistory[]>;
