import type { Static } from '@trezor/schema-utils';
import { Type } from '@trezor/schema-utils';

import { PROTO } from '../../constants';
import type { BundledParams, Params, Response } from '../params';
import { DerivationPath } from '../params';

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
