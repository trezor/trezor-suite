/**
 * Performs device setup and generates a new seed.
 */

import { Static, Type } from '@trezor/schema-utils';
import { PROTO } from '../../constants';
import type { Params, Response } from '../params';

export type ResetDevice = Static<typeof ResetDevice>;
export const ResetDevice = Type.Composite([
    PROTO.ResetDevice,
    Type.Object({
        backup_type: Type.Optional(Type.Union([Type.Literal(0), Type.Literal(1)])),
    }),
]);

export declare function resetDevice(params: Params<ResetDevice>): Response<PROTO.Success>;
