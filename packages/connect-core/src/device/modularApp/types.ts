import type { MessagesSchema as PROTO } from '@trezor/protobuf';

// Describes a loadable firmware modular app (a `.tapp` image plus its authentication material)
// and how the host maps wire messages to the app-local message ids used inside ExtAppMessage.
export interface ModularAppDefinition {
    // App id stored in the app header; matched against the device app cache.
    id: string;
    // Minimum required app version [major, minor, patch, build]. Empty uses the header version.
    minVersion?: number[];
    // App image binary (`.tapp`). Empty disables the modular path and keeps the native call flow.
    binary: Buffer;
    // Merkle proof for the app header (`.proof`).
    proof: Buffer;
    // Signed root packet (`.tmr`) authenticating the app.
    rootPacket: Buffer;
    // Wire message name -> app-local message id carried by ExtAppMessage/ExtAppResponse.
    messageIds: Partial<Record<PROTO.MessageKey, number>>;
}
