import { Static, Type } from '@trezor/schema-utils';
import { PROTO } from '../../constants';
import { Params, BundledParams, Response, DerivationPath } from '../params';

export type GetOwnershipProof = Static<typeof GetOwnershipProof>;
export const GetOwnershipProof = Type.Object({
    path: DerivationPath,
    coin: Type.Optional(Type.String()),
    multisig: Type.Optional(PROTO.MultisigRedeemScriptType),
    scriptType: Type.Optional(PROTO.InternalInputScriptType),
    userConfirmation: Type.Optional(Type.Boolean()),
    ownershipIds: Type.Optional(Type.Array(Type.String(), { minItems: 1 })),
    commitmentData: Type.Optional(Type.String()),
    preauthorized: Type.Optional(Type.Boolean()),
});

export interface OwnershipProof extends PROTO.OwnershipProof {
    path: number[];
    serializedPath: string;
}

export declare function getOwnershipProof(
    params: Params<GetOwnershipProof>,
): Response<OwnershipProof>;
export declare function getOwnershipProof(
    params: BundledParams<GetOwnershipProof>,
): Response<OwnershipProof[]>;
