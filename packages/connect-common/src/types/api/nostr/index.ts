import type { nostrGetPublicKey } from './nostrGetPublicKey';
import type { nostrSignEvent } from './nostrSignEvent';

// Nostr protocol operations
export interface TrezorConnectNostr {
    nostrGetPublicKey: typeof nostrGetPublicKey;
    nostrSignEvent: typeof nostrSignEvent;
}
