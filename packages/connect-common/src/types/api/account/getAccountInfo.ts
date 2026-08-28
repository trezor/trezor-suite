import type { BlockchainLinkParams } from '@trezor/blockchain-link';

import type { AccountInfo } from '../../account';
import type { CoinSymbol } from '../../coinInfo';
import type { BundledParams, Params, Response } from '../../params';

export interface GetAccountInfo extends Omit<BlockchainLinkParams<'getAccountInfo'>, 'descriptor'> {
    coin: CoinSymbol;
    identity?: string;
    descriptor: string;
}

export declare function getAccountInfo(params: Params<GetAccountInfo>): Response<AccountInfo>;
export declare function getAccountInfo(
    params: BundledParams<GetAccountInfo>,
): Response<(AccountInfo | null)[]>;
