import { MessagesSchema as PROTO } from '@trezor/protobuf';
import type { Static } from '@trezor/schema-utils';
import { Type } from '@trezor/schema-utils';

import { CoinSymbolParam } from '../../coinInfo';
import type { Address as AddressShared, BundleableMethod } from '../../params';
import { GetAddress as GetAddressShared } from '../../params';

export type GetAddress = Static<typeof GetAddress>;
export const GetAddress = Type.Composite([
    GetAddressShared,
    Type.Object({
        coin: Type.Optional(CoinSymbolParam()),
        crossChain: Type.Optional(Type.Boolean()),
        multisig: Type.Optional(PROTO.MultisigRedeemScriptType),
        scriptType: Type.Optional(PROTO.InternalInputScriptType),
        unlockPath: Type.Optional(PROTO.UnlockPath),
    }),
]);

type Address = AddressShared & PROTO.Address;

export declare const getAddress: BundleableMethod<GetAddress, Address>;
