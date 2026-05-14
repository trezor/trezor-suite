import { MessagesSchema as PROTO } from '@trezor/protobuf';
import type { Static } from '@trezor/schema-utils';
import { Type } from '@trezor/schema-utils';

import type { Address as AddressShared, BundledParams, Params, Response } from '../params';
import { GetAddress as GetAddressShared } from '../params';

export type GetAddress = Static<typeof GetAddress>;
export const GetAddress = Type.Composite([
    GetAddressShared,
    Type.Object({
        coin: Type.Optional(Type.String()),
        crossChain: Type.Optional(Type.Boolean()),
        multisig: Type.Optional(PROTO.MultisigRedeemScriptType),
        scriptType: Type.Optional(PROTO.InternalInputScriptType),
        unlockPath: Type.Optional(PROTO.UnlockPath),
    }),
]);

type Address = AddressShared & PROTO.Address;

export declare function getAddress(params: Params<GetAddress>): Response<Address>;
export declare function getAddress(params: BundledParams<GetAddress>): Response<Address[]>;
