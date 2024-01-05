/**
 * Ask device to initiate recovery procedure
 */

import { Static, Type } from '@trezor/schema-utils';
import { PROTO } from '../../constants';
import type { Params, Response } from '../params';

export type RecoveryDevice = Static<typeof RecoveryDevice>;
export const RecoveryDevice = Type.Composite([
    PROTO.RecoveryDevice,
    Type.Object({
        word_count: Type.Optional(
            Type.Union([Type.Literal(12), Type.Literal(18), Type.Literal(24)]),
        ),
    }),
]);

export declare function recoveryDevice(params: Params<RecoveryDevice>): Response<PROTO.Success>;
