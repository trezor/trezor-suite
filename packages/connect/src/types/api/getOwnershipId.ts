import type { PROTO } from '../../constants';
import type { Params, BundledParams, Response } from '../params';

export interface GetOwnershipId {
    path: string | number[];
    coin?: string;
    multisig?: PROTO.MultisigRedeemScriptType;
    scriptType?: PROTO.InternalInputScriptType;
}

export interface OwnershipId extends PROTO.OwnershipId {
    path: number[];
    serializedPath: string;
}

export declare function getOwnershipId(params: Params<GetOwnershipId>): Response<OwnershipId>;
export declare function getOwnershipId(
    params: BundledParams<GetOwnershipId>,
): Response<OwnershipId[]>;
