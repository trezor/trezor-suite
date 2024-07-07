import { Type, Static } from '@trezor/schema-utils';
import { MessagesSchema as PROTO } from '@trezor/protobuf';
import type { Params, Response } from '../params';

export type ApplySettings = Static<typeof ApplySettings>;
export const ApplySettings = Type.Composite([
    PROTO.ApplySettings,
    Type.Object({
        passphrase_source: Type.Optional(Type.Number()),
    }),
]);

export declare function applySettings(params: Params<ApplySettings>): Response<PROTO.Success>;
