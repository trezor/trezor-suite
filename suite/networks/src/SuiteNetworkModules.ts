import type { BitcoinNetworkSuiteNetworkModule } from '@trezor/network-bitcoin-suite';
import type { CardanoNetworkSuiteNetworkModule } from '@trezor/network-cardano-suite';
import type { EthereumNetworkSuiteNetworkModule } from '@trezor/network-ethereum-suite';

export type SuiteNetworkModules = {
    bitcoin: BitcoinNetworkSuiteNetworkModule;
    ethereum: EthereumNetworkSuiteNetworkModule;
    cardano: CardanoNetworkSuiteNetworkModule;
};

export type SuiteNetworkModule = SuiteNetworkModules[keyof SuiteNetworkModules];

export type SuiteNetworkSymbol = ReturnType<SuiteNetworkModule['getSupportedNetworks']>[number];

export type StaticSuiteNetworkModulesDep = {
    suiteNetworkModules: SuiteNetworkModules;
};
