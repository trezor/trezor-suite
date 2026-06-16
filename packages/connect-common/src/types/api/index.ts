import type { Static } from '@trezor/schema-utils';
import { Type } from '@trezor/schema-utils';

import type { nostrGetPublicKey } from './nostrGetPublicKey';
import type { nostrSignEvent } from './nostrSignEvent';

import { TrezorConnectAccount } from './account';
import { TrezorConnectBitcoin } from './bitcoin';
import { TrezorConnectBlockchain } from './blockchain';
import { TrezorConnectCardano } from './cardano';
import { TrezorConnectCore } from './core';
import { TrezorConnectDevice } from './device';
import { TrezorConnectEthereum } from './ethereum';
import { TrezorConnectEvolu } from './evolu';
import { TrezorConnectManagement } from './management';
import { TrezorConnectMonero } from './monero';
import { TrezorConnectRipple } from './ripple';
import { TrezorConnectSolana } from './solana';
import { TrezorConnectStellar } from './stellar';
import { TrezorConnectTezos } from './tezos';
import { TrezorConnectTron } from './tron';

export {
    TrezorConnectAccount,
    TrezorConnectBitcoin,
    TrezorConnectBlockchain,
    TrezorConnectCardano,
    TrezorConnectCore,
    TrezorConnectDevice,
    TrezorConnectEthereum,
    TrezorConnectEvolu,
    TrezorConnectManagement,
    TrezorConnectMonero,
    TrezorConnectRipple,
    TrezorConnectSolana,
    TrezorConnectStellar,
    TrezorConnectTezos,
    TrezorConnectTron,
};

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
