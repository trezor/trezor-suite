import type { Static } from '@trezor/schema-utils';
import { Type } from '@trezor/schema-utils';

import type { Address, BundledParams, Params, Response } from '../params';
import { GetAddress } from '../params';

export type NEMGetAddress = Static<typeof NEMGetAddress>;
export const NEMGetAddress = Type.Composite([
    GetAddress,
    Type.Object({
        network: Type.Number(),
    }),
]);

export declare function nemGetAddress(params: Params<NEMGetAddress>): Response<Address>;
export declare function nemGetAddress(params: BundledParams<NEMGetAddress>): Response<Address[]>;
