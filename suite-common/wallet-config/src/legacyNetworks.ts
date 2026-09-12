import { type LegacyNetworkConfigs, getLegacyNetworkConfigs } from '@suite-common/networks';
import { typedObjectEntries } from '@trezor/utils';

import { type NetworkFeature } from './networkTypes';

// Temporary compatibility access until consumers use the networks slice.
export const networks: LegacyNetworkConfigs = getLegacyNetworkConfigs();

type NetworksConfigs = typeof networks;

export type NetworkConfig = NetworksConfigs[keyof NetworksConfigs];

export type NetworkConfigWithoutTestnets = Exclude<NetworkConfig, { testnet: true }>;

export const toNetworkSymbolNonTestnet = (symbol: string): NetworkConfigWithoutTestnets['symbol'] =>
    symbol as NetworkConfigWithoutTestnets['symbol'];

export type NetworkDisplaySymbol = NetworkConfig['displaySymbol'];

type NetworkWithFeature<TFeature extends NetworkFeature> = {
    [S in keyof NetworksConfigs]: TFeature extends NetworksConfigs[S]['features'][number]
        ? NetworksConfigs[S]
        : never;
}[keyof NetworksConfigs];

export type StakingNetworkSymbol = NetworkWithFeature<'staking'>['symbol'];

export type StakingNetworkType = NetworksConfigs[StakingNetworkSymbol]['networkType'];

export const [STAKING_SYMBOLS, STAKING_TYPES, PROD_STAKING_SYMBOLS] = typedObjectEntries(
    networks,
).reduce<[StakingNetworkSymbol[], StakingNetworkType[], StakingNetworkSymbol[]]>(
    (acc, [symbol, { features, networkType, testnet }]) => {
        if ((features as readonly string[]).includes('staking')) {
            acc[0].push(symbol as StakingNetworkSymbol);

            if (!testnet) {
                acc[2].push(symbol as StakingNetworkSymbol);
            }

            const t = networkType as StakingNetworkType;
            if (!acc[1].includes(t)) acc[1].push(t);
        }

        return acc;
    },
    [[], [], []],
) as readonly [
    readonly StakingNetworkSymbol[],
    readonly StakingNetworkType[],
    readonly (StakingNetworkSymbol & NetworkConfigWithoutTestnets['symbol'])[],
];
