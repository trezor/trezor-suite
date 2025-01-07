import { Type, Static } from '@trezor/schema-utils';

import { PROTO } from '../../constants';
import { DerivationPath, Params, Response } from '../params';

export type NostrSignEvent = Static<typeof NostrSignEvent>;
export const NostrSignEvent = Type.Intersect([
    Type.Object({
        path: DerivationPath,
    }),
    Type.Omit(PROTO.NostrSignEvent, Type.Literal('address_n')),
]);

export declare function nostrSignEvent(
    params: Params<NostrSignEvent>,
): Response<PROTO.NostrEventSignature>;
