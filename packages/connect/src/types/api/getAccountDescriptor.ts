import type { PROTO } from '../../constants';
import type { Params, BundledParams, Response, DerivationPath } from '../params';

export interface GetAccountDescriptorParams {
    path: DerivationPath;
    coin: string;
    derivationType?: PROTO.CardanoDerivationType;
    suppressBackupWarning?: boolean;
}

export interface GetAccountDescriptorResponse {
    descriptor: string;
    path: string;
    legacyXpub?: string; // bitcoin-like descriptor in legacy format (xpub) used by labeling (metadata)
}

export declare function getAccountDescriptor(
    params: Params<GetAccountDescriptorParams>,
): Response<GetAccountDescriptorResponse>;
export declare function getAccountDescriptor(
    params: BundledParams<GetAccountDescriptorParams>,
): Response<(GetAccountDescriptorResponse | null)[]>;
