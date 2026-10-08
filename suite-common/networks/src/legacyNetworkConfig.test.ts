import { networkConfigBySymbol as bitcoinConfigs } from '@trezor/network-bitcoin-suite-common';
import { networkConfigBySymbol as cardanoConfigs } from '@trezor/network-cardano-suite-common';
import { networkConfigBySymbol as ethereumConfigs } from '@trezor/network-ethereum-suite-common';
import { networkConfigBySymbol as rippleConfigs } from '@trezor/network-ripple-suite-common';
import { networkConfigBySymbol as solanaConfigs } from '@trezor/network-solana-suite-common';
import { networkConfigBySymbol as stellarConfigs } from '@trezor/network-stellar-suite-common';
import { networkConfigBySymbol as tronConfigs } from '@trezor/network-tron-suite-common';

import { getLegacyNetworkConfigs } from './legacyNetworkConfig';

const familyConfigs = {
    ...bitcoinConfigs,
    ...cardanoConfigs,
    ...ethereumConfigs,
    ...rippleConfigs,
    ...solanaConfigs,
    ...stellarConfigs,
    ...tronConfigs,
};

describe(getLegacyNetworkConfigs.name, () => {
    // A network is added in its family package alone; the legacy configs follow.
    it('lists every network the families configure, as configured', () => {
        const networks = getLegacyNetworkConfigs();

        expect(Object.keys(networks).sort()).toEqual(Object.keys(familyConfigs).sort());
        Object.entries(familyConfigs).forEach(([symbol, config]) => {
            expect(networks[symbol as keyof typeof networks]).toEqual({ ...config, symbol });
        });
    });
});
