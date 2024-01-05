import { Static, Type } from '@trezor/schema-utils';
import { PROTO } from '../../constants';
import {
    GetAddress as GetAddressShared,
    Address as AddressShared,
    Params,
    BundledParams,
    Response,
} from '../params';

export type GetAddress = Static<typeof GetAddress>;
export const GetAddress = Type.Composite([
    GetAddressShared,
    Type.Object({
        coin: Type.Optional(Type.String()),
        crossChain: Type.Optional(Type.Boolean()),
        multisig: Type.Optional(PROTO.MultisigRedeemScriptType),
        scriptType: Type.Optional(PROTO.InternalInputScriptType),
        unlockPath: Type.Optional(Type.Object({ address_n: Type.Array(Type.Number()) })),
    }),
]);

type Address = AddressShared & PROTO.Address;

export declare function getAddress(params: Params<GetAddress>): Response<Address>;
export declare function getAddress(params: BundledParams<GetAddress>): Response<Address[]>;
