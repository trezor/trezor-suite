import type { PROTO } from '../../constants';
import type { Params, BundledParams, Response } from '../params';

export interface GetOwnershipProof {
    path: string | number[];
    coin?: string;
    multisig?: PROTO.MultisigRedeemScriptType;
    scriptType?: PROTO.InternalInputScriptType;
    userConfirmation?: boolean;
    ownershipIds?: string[];
    commitmentData?: string;
}

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
