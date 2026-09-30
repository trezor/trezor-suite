import type { MessagesSchema as PROTO } from '@trezor/protobuf';

// Loadable firmware modular app. The `.tapp` artifacts resolve separately via `loadArtifacts`, so
// they can be fetched remotely.
export interface ModularAppDefinition {
    // App id stored in the app header; matched against the device app cache.
    id: string;
    // Minimum required app version [major, minor, patch, build]. Empty uses the header version.
    minVersion?: number[];
    // Wire message name -> app-local message id carried by ExtAppMessage/ExtAppResponse.
    messageIds: Partial<Record<PROTO.MessageKey, number>>;
    // Absent keeps the native call flow.
    loadArtifacts?: () => Promise<ModularAppArtifacts>;
}

// Base64-encoded artifacts as stored in the JSON asset.
export interface ModularAppArtifactsJson {
    // App image binary (`.tapp`). Empty disables the modular path and keeps the native call flow.
    binary: string;
    // Merkle proof for the app header (`.proof`).
    proof: string;
    // Signed root packet (`.tmr`) authenticating the app.
    rootPacket: string;
}

export interface ModularAppArtifacts {
    binary: Buffer;
    proof: Buffer;
    rootPacket: Buffer;
}
