import { PROTO } from '../../constants';
import { GetPublicKey as GetPublicKeyShared, Params, BundledParams, Response } from '../params';
import { Type, Static } from '@trezor/schema-utils';

export type GetPublicKey = Static<typeof GetPublicKey>;
export const GetPublicKey = Type.Intersect([
    GetPublicKeyShared,
    Type.Object({
        coin: Type.Optional(Type.String()),
        crossChain: Type.Optional(Type.Boolean()),
        scriptType: Type.Optional(PROTO.InternalInputScriptType),
        ignoreXpubMagic: Type.Optional(Type.Boolean()),
        ecdsaCurveName: Type.Optional(Type.String()),
        unlockPath: Type.Optional(PROTO.UnlockPath),
    }),
]);

// PROTO.HDNodeType with camelcase fields + path
export type HDNodeResponse = Static<typeof HDNodeResponse>;
export const HDNodeResponse = Type.Object({
    path: Type.Array(Type.Number()),
    serializedPath: Type.String(),
    childNum: Type.Number(),
    xpub: Type.String(),
    xpubSegwit: Type.Optional(Type.String()),
    chainCode: Type.String(),
    publicKey: Type.String(),
    fingerprint: Type.Number(),
    depth: Type.Number(),
});

export declare function getPublicKey(params: Params<GetPublicKey>): Response<HDNodeResponse>;
export declare function getPublicKey(
    params: BundledParams<GetPublicKey>,
): Response<HDNodeResponse[]>;
