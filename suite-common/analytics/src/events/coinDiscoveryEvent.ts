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
    changelog: [
        { version: '26.3.1', notes: 'added on desktop' },
        { version: '26.2.3', notes: 'added on mobile' },
    ],

    attributes: {
        discoveryId: {
            changelog: [
                { version: '26.3.1', notes: 'added on desktop' },
                { version: '26.2.3', notes: 'added on mobile' },
            ],
            description: 'Discovery id (device.path)',
        },
        symbol: {
            changelog: [
                { version: '26.3.1', notes: 'added on desktop' },
                { version: '26.2.3', notes: 'added on mobile' },
            ],
            description: 'Coin symbol',
        },
        numberOfAccounts: {
            changelog: [
                { version: '26.3.1', notes: 'added on desktop' },
                { version: '26.2.3', notes: 'added on mobile' },
            ],
            description: 'Number of accounts',
        },
        numberOfNonZeroAccounts: {
            changelog: [
                { version: '26.3.1', notes: 'added on desktop' },
                { version: '26.2.3', notes: 'added on mobile' },
            ],
            description: 'Number of non zero accounts',
        },
        tokenAddresses: {
            changelog: [
                { version: '26.3.1', notes: 'added on desktop' },
                { version: '26.2.3', notes: 'added on mobile' },
            ],
            description: 'Token addresses',
        },
        tokenSymbols: {
            changelog: [
                { version: '26.3.1', notes: 'added on desktop' },
                { version: '26.2.3', notes: 'added on mobile' },
            ],
            description: 'Token symbols',
        },
        numberOfStakedAccounts: {
            changelog: [
                { version: '26.3.1', notes: 'added on desktop' },
                { version: '26.2.3', notes: 'added on mobile' },
            ],
            description: 'Number of staked accounts',
        },
    },
};
