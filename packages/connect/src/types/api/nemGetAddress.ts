import { Static, Type } from '@trezor/schema-utils';

import { Address, BundledParams, GetAddress, Params, Response } from '../params';

export type NEMGetAddress = Static<typeof NEMGetAddress>;
export const NEMGetAddress = Type.Composite([
    GetAddress,
    Type.Object({
        network: Type.Number(),
    }),
]);

export declare function nemGetAddress(params: Params<NEMGetAddress>): Response<Address>;
export declare function nemGetAddress(params: BundledParams<NEMGetAddress>): Response<Address[]>;
