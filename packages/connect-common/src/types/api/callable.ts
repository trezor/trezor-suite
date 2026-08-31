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
import type { TrezorConnectWard } from './ward';

// The explicit intersection prevents TypeScript from expanding the entire callable API in the
// generated declaration.
export type TrezorConnectCallable = TrezorConnectManagement &
    TrezorConnectDevice &
    TrezorConnectBlockchain &
    TrezorConnectAccount &
    TrezorConnectBitcoin &
    TrezorConnectEthereum &
    TrezorConnectCardano &
    TrezorConnectMonero &
    TrezorConnectRipple &
    TrezorConnectSolana &
    TrezorConnectStellar &
    TrezorConnectTezos &
    TrezorConnectTron &
    TrezorConnectEvolu &
    TrezorConnectNostr &
    TrezorConnectWard;
