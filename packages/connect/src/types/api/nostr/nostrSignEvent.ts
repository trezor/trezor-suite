import { Static, Type } from '@trezor/schema-utils';
import { PROTO } from '../../../constants';
import { DerivationPath, Params, Response } from '../../params';

export type NostrTag = Static<typeof NostrTag>;
export const NostrTag = Type.Object({
    key: Type.String(),
    value: Type.Optional(Type.String()),
    extra: Type.Array(Type.String()),
});

export type NostrSignEvent = Static<typeof NostrSignEvent>;
export const NostrSignEvent = Type.Object({
    path: DerivationPath,
    created_at: Type.Number(),
    kind: Type.Number(),
    tags: Type.Array(NostrTag),
    content: Type.String(),
});

export declare function nostrSignEvent(
    params: Params<NostrSignEvent>,
): Response<PROTO.NostrEventSignature>;
