import type { BlockchainLinkParams } from '@trezor/blockchain-link';
import type { MessagesSchema as PROTO } from '@trezor/protobuf';

import type { AccountInfo, DiscoveryAccountType } from '../../account';
import type { CoinSymbol } from '../../coinInfo';
import type { BundledParams, Params, Response } from '../../params';

export interface GetAccountInfo extends Omit<BlockchainLinkParams<'getAccountInfo'>, 'descriptor'> {
    coin: CoinSymbol;
    identity?: string;
    path?: string;
    descriptor?: string;
    defaultAccountType?: DiscoveryAccountType;
    derivationType?: PROTO.CardanoDerivationType;
    suppressBackupWarning?: boolean;
}

// Internal flag set by Suite for connect 9.x host apps; skips the check that `path` belongs to `coin`.
export type GetAccountInfoV9Compat = { _v9_compat?: boolean };

export declare function getAccountInfo(
    params: Params<GetAccountInfo> & GetAccountInfoV9Compat,
): Response<AccountInfo>;
export declare function getAccountInfo(
    params: BundledParams<GetAccountInfo> & GetAccountInfoV9Compat,
): Response<(AccountInfo | null)[]>;
