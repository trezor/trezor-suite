import { type Static, Type } from '@trezor/schema-utils';

import type { nostrGetPublicKey } from './nostrGetPublicKey';
import type { nostrSignEvent } from './nostrSignEvent';

// Nostr protocol operations
export const TrezorConnectNostr = Type.Object({
    nostrGetPublicKey: Type.Unsafe<typeof nostrGetPublicKey>(),
    nostrSignEvent: Type.Unsafe<typeof nostrSignEvent>(),
});
export type TrezorConnectNostr = Static<typeof TrezorConnectNostr>;
