import type { BlockchainLinkParams } from '@trezor/blockchain-link';
import type { PROTO } from '../../constants';
import type { Params, BundledParams, Response } from '../params';
import type { AccountInfo, DiscoveryAccountType } from '../account';

export interface GetAccountInfo extends Omit<BlockchainLinkParams<'getAccountInfo'>, 'descriptor'> {
    coin: string;
    identity?: string;
    path?: string;
    descriptor?: string;
    defaultAccountType?: DiscoveryAccountType;
    derivationType?: PROTO.CardanoDerivationType;
    suppressBackupWarning?: boolean;
}

export declare function getAccountInfo(params: Params<GetAccountInfo>): Response<AccountInfo>;
export declare function getAccountInfo(
    params: BundledParams<GetAccountInfo>,
): Response<(AccountInfo | null)[]>;
