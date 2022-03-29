/**
 * Bitcoin, Bitcoin-like, Ethereum-like, Ripple
 * Gets an info of specified account.
 */

import type { AccountInfoParams } from '@trezor/blockchain-link/lib/types/params'; // TODO: export from B-L
import type { Messages } from '@trezor/transport';
import type { Params, BundledParams, Response, BundledResponse } from '../params';
import type { AccountInfo, DiscoveryAccountType } from '../account';

export interface GetAccountInfo extends Omit<AccountInfoParams, 'descriptor'> {
    coin: string;
    path?: string;
    descriptor?: string;
    defaultAccountType?: DiscoveryAccountType;
    derivationType?: Messages.CardanoDerivationType;
}

export declare function getAccountInfo(params: Params<GetAccountInfo>): Response<AccountInfo>;
export declare function getAccountInfo(
    params: BundledParams<GetAccountInfo>,
): BundledResponse<AccountInfo>;
