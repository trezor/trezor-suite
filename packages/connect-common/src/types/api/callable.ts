import type { TrezorConnectAccount } from './account';
import type { TrezorConnectBitcoin } from './bitcoin';
import type { TrezorConnectBlockchain } from './blockchain';
import type { TrezorConnectCardano } from './cardano';
import type { TrezorConnectDevice } from './device';
import type { TrezorConnectEthereum } from './ethereum';
import type { TrezorConnectEvolu } from './evolu';
import type { TrezorConnectManagement } from './management';
import type { TrezorConnectMonero } from './monero';
import type { TrezorConnectNostr } from './nostr';
import type { TrezorConnectRipple } from './ripple';
import type { TrezorConnectSolana } from './solana';
import type { TrezorConnectStellar } from './stellar';
import type { TrezorConnectTezos } from './tezos';
import type { TrezorConnectTron } from './tron';

// Keep this composition declarative: deriving it through TypeBox makes TypeScript expand every
// method signature when resolving one member, while named interfaces preserve domain boundaries.
export interface TrezorConnectPublicCallable
    extends
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
        TrezorConnectNostr {}

export interface TrezorConnectCallable
    extends TrezorConnectPublicCallable, TrezorConnectManagement {}
