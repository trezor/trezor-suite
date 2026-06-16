import { type Static, Type } from '@trezor/schema-utils';

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
import { TrezorConnectNostr } from './nostr';
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
    TrezorConnectNostr,
    TrezorConnectRipple,
    TrezorConnectSolana,
    TrezorConnectStellar,
    TrezorConnectTezos,
    TrezorConnectTron,
};

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

export type TrezorConnect = Static<typeof TrezorConnectSchema>;
