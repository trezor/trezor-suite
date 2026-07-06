import type { BlockchainLinkParams } from '@trezor/blockchain-link';
import type { MessagesSchema as PROTO } from '@trezor/protobuf';

import type { AccountInfo, DiscoveryAccountType } from '../../account';
import type { BundledParams, Params, Response } from '../../params';

export interface GetAccountInfo extends Omit<BlockchainLinkParams<'getAccountInfo'>, 'descriptor'> {
    coin: string;
    identity?: string;
    path?: string;
    descriptor?: string;
    defaultAccountType?: DiscoveryAccountType;
    derivationType?: PROTO.CardanoDerivationType;
    suppressBackupWarning?: boolean;
    // Monero only: wallet "birthday" forwarded to the backend so the client-side scan can start from
    // that point instead of the genesis block. The private view key is fetched from the device here,
    // so the host only provides the date. month is 1-12.
    moneroRestoreDate?: { year: number; month: number };
    // Monero only: interrupt the current scan and rebuild the wallet from moneroRestoreDate (the user
    // picked a different birthday). The existing wallet + its on-disk cache are discarded.
    moneroResetScan?: boolean;
}

export declare function getAccountInfo(params: Params<GetAccountInfo>): Response<AccountInfo>;
export declare function getAccountInfo(
    params: BundledParams<GetAccountInfo>,
): Response<(AccountInfo | null)[]>;
