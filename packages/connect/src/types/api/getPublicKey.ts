import type {
    GetPublicKey as GetPublicKeyShared,
    Params,
    BundledParams,
    Response,
} from '../params';

export interface GetPublicKey extends GetPublicKeyShared {
    coin?: string;
    crossChain?: boolean;
}

// PROTO.HDNodeType with camelcase fields + path
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
): Response<HDNodeResponse[]>;
