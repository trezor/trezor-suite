import type { Static } from '@trezor/schema-utils';
import { Type } from '@trezor/schema-utils';

import type { evoluGetDelegatedIdentityKey } from './evoluGetDelegatedIdentityKey';
import type { evoluGetNode } from './evoluGetNode';
import type { evoluSignRegistrationRequest } from './evoluSignRegistrationRequest';
import type { nostrGetPublicKey } from './nostrGetPublicKey';
import type { nostrSignEvent } from './nostrSignEvent';
import type { stellarGetAddress } from './stellarGetAddress';
import type { stellarSignTransaction } from './stellarSignTransaction';
import type { tezosGetAddress } from './tezosGetAddress';
import type { tezosGetPublicKey } from './tezosGetPublicKey';
import type { tezosSignTransaction } from './tezosSignTransaction';
import type { tronComposeTransaction } from './tronComposeTransaction';
import type { tronGetAddress } from './tronGetAddress';
import type { tronSignTransaction } from './tronSignTransaction';

import { TrezorConnectAccount } from './account';
import { TrezorConnectBitcoin } from './bitcoin';
import { TrezorConnectBlockchain } from './blockchain';
import { TrezorConnectCardano } from './cardano';
import { TrezorConnectCore } from './core';
import { TrezorConnectDevice } from './device';
import { TrezorConnectEthereum } from './ethereum';
import { TrezorConnectManagement } from './management';
import { TrezorConnectMonero } from './monero';
import { TrezorConnectRipple } from './ripple';
import { TrezorConnectSolana } from './solana';

export {
    TrezorConnectAccount,
    TrezorConnectBitcoin,
    TrezorConnectBlockchain,
    TrezorConnectCardano,
    TrezorConnectCore,
    TrezorConnectDevice,
    TrezorConnectEthereum,
    TrezorConnectManagement,
    TrezorConnectMonero,
    TrezorConnectRipple,
    TrezorConnectSolana,
};

// Stellar-specific operations
export const TrezorConnectStellar = Type.Object({
    // https://connect.trezor.io/9/methods/stellar/stellarGetAddress/
    stellarGetAddress: Type.Unsafe<typeof stellarGetAddress>(),

    // https://connect.trezor.io/9/methods/stellar/stellarSignTransaction/
    stellarSignTransaction: Type.Unsafe<typeof stellarSignTransaction>(),
});
export type TrezorConnectStellar = Static<typeof TrezorConnectStellar>;

// Tezos-specific operations
export const TrezorConnectTezos = Type.Object({
    // https://connect.trezor.io/9/methods/tezos/tezosGetAddress/
    tezosGetAddress: Type.Unsafe<typeof tezosGetAddress>(),

    // https://connect.trezor.io/9/methods/tezos/tezosGetPublicKey/
    tezosGetPublicKey: Type.Unsafe<typeof tezosGetPublicKey>(),

    // https://connect.trezor.io/9/methods/tezos/tezosSignTransaction/
    tezosSignTransaction: Type.Unsafe<typeof tezosSignTransaction>(),
});
export type TrezorConnectTezos = Static<typeof TrezorConnectTezos>;

// Tron-specific operations
export const TrezorConnectTron = Type.Object({
    // https://connect.trezor.io/9/methods/tron/tronGetAddress/
    tronGetAddress: Type.Unsafe<typeof tronGetAddress>(),

    // https://connect.trezor.io/9/methods/tron/tronSignTransaction/
    tronSignTransaction: Type.Unsafe<typeof tronSignTransaction>(),

    tronComposeTransaction: Type.Unsafe<typeof tronComposeTransaction>(),
});
export type TrezorConnectTron = Static<typeof TrezorConnectTron>;

// Evolu identity protocol operations
export const TrezorConnectEvolu = Type.Object({
    // For internal use, no public documentation.
    evoluGetNode: Type.Unsafe<typeof evoluGetNode>(),

    // For internal use, no public documentation.
    evoluSignRegistrationRequest: Type.Unsafe<typeof evoluSignRegistrationRequest>(),

    // For internal use, no public documentation.
    evoluGetDelegatedIdentityKey: Type.Unsafe<typeof evoluGetDelegatedIdentityKey>(),
});
export type TrezorConnectEvolu = Static<typeof TrezorConnectEvolu>;

// Nostr protocol operations
export const TrezorConnectNostr = Type.Object({
    // For internal use, no public documentation.
    nostrGetPublicKey: Type.Unsafe<typeof nostrGetPublicKey>(),

    // For internal use, no public documentation.
    nostrSignEvent: Type.Unsafe<typeof nostrSignEvent>(),
});
export type TrezorConnectNostr = Static<typeof TrezorConnectNostr>;

// Experimental methods — each requires `__experimental: true` in its params.
export const TrezorConnectExperimental = Type.Composite([TrezorConnectNostr]);
export type TrezorConnectExperimental = Static<typeof TrezorConnectExperimental>;

// Runtime schema for key access
export const TrezorConnectSchema = Type.Composite([
    TrezorConnectCore,
    TrezorConnectManagement,
    TrezorConnectDevice,
    TrezorConnectBlockchain,
    TrezorConnectAccount,
    TrezorConnectBitcoin,
    TrezorConnectEthereum,
    TrezorConnectCardano,
    TrezorConnectMonero,
    TrezorConnectRipple,
    TrezorConnectSolana,
    TrezorConnectStellar,
    TrezorConnectTezos,
    TrezorConnectTron,
    TrezorConnectEvolu,
    TrezorConnectExperimental,
]);

// Type-level interface for precise function types.
export interface TrezorConnect
    extends
        TrezorConnectCore,
        TrezorConnectManagement,
        TrezorConnectDevice,
        TrezorConnectBlockchain,
        TrezorConnectAccount,
        TrezorConnectBitcoin,
        TrezorConnectEthereum,
        TrezorConnectCardano,
        TrezorConnectMonero,
        TrezorConnectRipple,
        TrezorConnectSolana,
        TrezorConnectStellar,
        TrezorConnectTezos,
        TrezorConnectTron,
        TrezorConnectEvolu,
        TrezorConnectExperimental {}
