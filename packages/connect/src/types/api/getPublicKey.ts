/**
 * Bitcoin and Bitcoin-like
 * Retrieves BIP32 extended public derived by given BIP32 path.
 * User is presented with a description of the requested key and asked to
 * confirm the export.
 */

import type {
    GetPublicKey as GetPublicKeyShared,
    Params,
    BundledParams,
    Response,
    BundledResponse,
} from '../params';

export interface GetPublicKey extends GetPublicKeyShared {
    coin?: string;
    crossChain?: boolean;
}

// combined Bitcoin.PublicKey and Bitcoin.HDNode
export interface HDNodeResponse {
    path: number[];
    serializedPath: string;
    childNum: number;
    xpub: string;
    xpubSegwit?: string;
    chainCode: string;
    publicKey: string;
    fingerprint: number;
    depth: number;
}

export declare function getPublicKey(params: Params<GetPublicKey>): Response<HDNodeResponse>;
export declare function getPublicKey(
    params: BundledParams<GetPublicKey>,
): BundledResponse<HDNodeResponse>;
