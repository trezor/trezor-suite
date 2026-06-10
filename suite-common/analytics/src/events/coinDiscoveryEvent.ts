import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type TokenAddress, type TokenSymbol } from '@suite-common/wallet-types';

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
    stakingProviders: AttributeDef<string[]>;
};

export const coinDiscoveryEvent: EventDef<Attributes, EventType.CoinDiscovery> = {
    name: EventType.CoinDiscovery,
    descriptionTrigger:
        "Fired once per discovered network symbol when a coin discovery run completes — one event per coin, reporting that coin's aggregated account, token and staking metrics for the device. Discovery is not limited to device connection; it runs whenever accounts are (re)scanned: connecting, acquiring or switching a device, adding a standard or hidden (passphrase) wallet, finishing onboarding, enabling or disabling a coin, creating an account or changing its visibility, manually rediscovering, regaining network connectivity, navigating into the wallet, or handling a Connect popup call.",
    changelog: [
        { version: '26.3.1', notes: 'added on desktop' },
        { version: '26.2.2', notes: 'added on mobile' },
    ],

    attributes: {
        discoveryId: {
            changelog: [
                { version: '26.3.1', notes: 'added on desktop' },
                { version: '26.2.2', notes: 'added on mobile' },
            ],
            description:
                'Identifier of the device whose discovery this report belongs to (the device static session id)',
        },
        symbol: {
            changelog: [
                { version: '26.3.1', notes: 'added on desktop' },
                { version: '26.2.2', notes: 'added on mobile' },
            ],
            description: 'The blockchain network symbol discovered (e.g., `btc`, `eth`, `sol`)',
        },
        numberOfAccounts: {
            changelog: [
                { version: '26.3.1', notes: 'added on desktop' },
                { version: '26.2.2', notes: 'added on mobile' },
            ],
            description:
                'Number of discovered accounts on this network that have some transaction history',
        },
        numberOfNonZeroAccounts: {
            changelog: [
                { version: '26.3.1', notes: 'added on desktop' },
                { version: '26.2.2', notes: 'added on mobile' },
            ],
            description: 'Number of accounts that contain funds (non-zero balance)',
        },
        tokenAddresses: {
            changelog: [
                { version: '26.3.1', notes: 'added on desktop' },
                { version: '26.2.2', notes: 'added on mobile' },
            ],
            description: 'Smart contract addresses of detected tokens on this network',
        },
        tokenSymbols: {
            changelog: [
                { version: '26.3.1', notes: 'added on desktop' },
                { version: '26.2.2', notes: 'added on mobile' },
            ],
            description: 'Symbols/tickers of detected tokens (e.g., `USDC`, `DAI`, `USDT`)',
        },
        numberOfStakedAccounts: {
            changelog: [
                { version: '26.3.1', notes: 'added on desktop' },
                { version: '26.2.2', notes: 'added on mobile' },
            ],
            description: 'Number of accounts with staking positions on this network',
        },
        stakingProviders: {
            changelog: [
                { version: '26.4.1', notes: 'added on desktop' },
                { version: '26.4.1', notes: 'added on mobile' },
            ],
            description:
                'List of staking service providers detected for this coin (e.g., `lido`, `rocketpool`)',
        },
    },
};
