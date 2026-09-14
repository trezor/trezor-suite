import type { Networks } from '@suite-common/networks';
import { type NetworkFeature } from './networkTypes';

type NetworksConfigs = Networks;

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
