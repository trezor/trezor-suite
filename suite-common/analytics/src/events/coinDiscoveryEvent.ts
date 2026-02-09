import { NetworkSymbol } from '@suite-common/wallet-config';
import { TokenAddress, TokenSymbol } from '@suite-common/wallet-types';

import { EventType } from '../constants';
import type { AttributeDef, EventDef } from '../eventDefinition';

type Attributes = {
    discoveryId: AttributeDef<string>;
    symbol: AttributeDef<NetworkSymbol>;
    numberOfAccounts: AttributeDef<number>;
    numberOfNonZeroAccounts: AttributeDef<number>;
    tokenSymbols: AttributeDef<TokenSymbol[]>;
    tokenAddresses: AttributeDef<TokenAddress[]>;
    numberOfStakedAccounts: AttributeDef<number>;
};

export const coinDiscoveryEvent: EventDef<Attributes, EventType.CoinDiscovery> = {
    name: EventType.CoinDiscovery,
    descriptionTrigger: 'Coin discovery - when wallet is discovered',
    changelog: [{ version: '26.2.0', notes: 'added' }],

    attributes: {
        discoveryId: {
            changelog: [{ version: '26.2.0', notes: 'added' }],
            description: 'Discovery id (device.path)',
        },
        symbol: {
            changelog: [{ version: '26.2.0', notes: 'added' }],
            description: 'Coin symbol',
        },
        numberOfAccounts: {
            changelog: [{ version: '26.2.0', notes: 'added' }],
            description: 'Number of accounts',
        },
        numberOfNonZeroAccounts: {
            changelog: [{ version: '26.2.0', notes: 'added' }],
            description: 'Number of non zero accounts',
        },
        tokenAddresses: {
            changelog: [{ version: '26.2.0', notes: 'added' }],
            description: 'Token addresses',
        },
        tokenSymbols: {
            changelog: [{ version: '26.2.0', notes: 'added' }],
            description: 'Token symbols',
        },
        numberOfStakedAccounts: {
            changelog: [{ version: '26.2.0', notes: 'added' }],
            description: 'Number of staked accounts',
        },
    },
};
