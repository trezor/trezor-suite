import { networks } from '@suite-common/wallet-config';
import type { SignVerifyCapability, SuiteNetworkModule } from '@trezor/network-module-suite-types';

import { createSuiteNetworkModuleRepository } from './SuiteNetworkModuleRepository';
import type { SuiteNetworkModules } from './SuiteNetworkModules';

describe('SuiteNetworkModuleRepository', () => {
    it('registers every network that exposes Sign & Verify', () => {
        const signVerify: SignVerifyCapability = {
            getSignAddresses: () => [],
            sign: jest.fn(),
            formatSignedMessage: () => '',
        };
        const createSuiteNetworkModule = <const TSymbols extends readonly string[]>(
            supportedNetworks: TSymbols,
        ): SuiteNetworkModule<TSymbols[number]> => ({
            signVerify,
            getSupportedNetworks: () => supportedNetworks,
            isSupportedNetwork: (symbol: string): symbol is TSymbols[number] =>
                supportedNetworks.some(supportedNetwork => supportedNetwork === symbol),
        });
        const suiteNetworkModules: SuiteNetworkModules = {
            bitcoin: createSuiteNetworkModule([
                'btc',
                'test',
                'regtest',
                'ltc',
                'doge',
                'zec',
                'bch',
            ]),
            ethereum: createSuiteNetworkModule([
                'eth',
                'pol',
                'bsc',
                'arb',
                'base',
                'op',
                'rhc',
                'hype',
                'avax',
                'etc',
                'tsep',
                'thod',
            ]),
            cardano: createSuiteNetworkModule(['ada']),
        };
        const repository = createSuiteNetworkModuleRepository({ suiteNetworkModules });
        const expectedNetworks = Object.values(networks)
            .filter(network => (network.features as readonly string[]).includes('sign-verify'))
            .map(network => network.symbol)
            .sort();

        expect([...repository.getSupportedNetworks()].sort()).toEqual(expectedNetworks);
        expectedNetworks.forEach(symbol => {
            expect(repository.get(symbol)?.signVerify).toBe(signVerify);
        });
    });
});
