import { Static, Type } from '@trezor/schema-utils';
import { MessagesSchema as PROTO } from '@trezor/protobuf';
import { Params, BundledParams, Response, DerivationPath } from '../params';

export type GetOwnershipId = Static<typeof GetOwnershipId>;
export const GetOwnershipId = Type.Object({
    path: DerivationPath,
    coin: Type.Optional(Type.String()),
    multisig: Type.Optional(PROTO.MultisigRedeemScriptType),
    scriptType: Type.Optional(PROTO.InternalInputScriptType),
});

export interface OwnershipId extends PROTO.OwnershipId {
    path: number[];
    serializedPath: string;
}

export declare function getOwnershipId(params: Params<GetOwnershipId>): Response<OwnershipId>;
export declare function getOwnershipId(
    params: BundledParams<GetOwnershipId>,
): Response<OwnershipId[]>;
