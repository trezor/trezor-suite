import { type Static, Type } from '@trezor/schema-utils';

import { TrezorConnectAccount } from './account';
import { TrezorConnectBitcoin } from './bitcoin';
import { TrezorConnectBlockchain } from './blockchain';
import { TrezorConnectCardano } from './cardano';
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

export const TrezorConnectCallable = Type.Composite([
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
    TrezorConnectNostr,
]);
export type TrezorConnectCallable = Static<typeof TrezorConnectCallable>;
