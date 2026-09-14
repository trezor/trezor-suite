import type { TokenDtoV2 } from '@suite-common/earn-stablecoin-defs';
import type { networkConfigBySymbol as bitcoinConfigs } from '@trezor/network-bitcoin-suite-common';
import type { networkConfigBySymbol as cardanoConfigs } from '@trezor/network-cardano-suite-common';
import type { networkConfigBySymbol as ethereumConfigs } from '@trezor/network-ethereum-suite-common';
import type { SuiteCommonNetworkConfig } from '@trezor/network-module-suite-common-types';
import type { networkConfigBySymbol as rippleConfigs } from '@trezor/network-ripple-suite-common';
import type { networkConfigBySymbol as solanaConfigs } from '@trezor/network-solana-suite-common';
import type { networkConfigBySymbol as stellarConfigs } from '@trezor/network-stellar-suite-common';
import type { networkConfigBySymbol as tronConfigs } from '@trezor/network-tron-suite-common';

import type { NetworkSymbol } from './NetworkModules';

export type Network = Omit<SuiteCommonNetworkConfig<NetworkSymbol>, 'yieldXyzId'> & {
    symbol: NetworkSymbol;
    yieldXyzId: TokenDtoV2['network'] | null;
};

type ModuleConfigs = typeof bitcoinConfigs &
    typeof ethereumConfigs &
    typeof rippleConfigs &
    typeof cardanoConfigs &
    typeof solanaConfigs &
    typeof stellarConfigs &
    typeof tronConfigs;

export type Networks = {
    [Symbol in keyof ModuleConfigs]: Omit<Network, 'settlementLayer'> &
        Omit<ModuleConfigs[Symbol], 'yieldXyzId'> & {
            symbol: Symbol;
            yieldXyzId: Network['yieldXyzId'];
        };
};
