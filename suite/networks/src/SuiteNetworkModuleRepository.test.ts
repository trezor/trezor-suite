import type { SuiteNetworkModule } from '@trezor/network-module-suite-types';

import { createSuiteNetworkModuleRepository } from './SuiteNetworkModuleRepository';
import type { SuiteNetworkModules } from './SuiteNetworkModules';

const createModule = (symbols: string[], signVerify: SuiteNetworkModule<string>['signVerify']) =>
    ({
        signVerify,
        getSupportedNetworks: () => symbols,
        isSupportedNetwork: (symbol: string): symbol is string => symbols.includes(symbol),
    }) as unknown as SuiteNetworkModules[keyof SuiteNetworkModules];

const signVerify = { Component: () => null, title: 'TR_NAV_SIGN_VERIFY' } as NonNullable<
    SuiteNetworkModule<string>['signVerify']
>;

const suiteNetworkModules = {
    bitcoin: createModule(['btc', 'ltc'], signVerify),
    solana: createModule(['sol'], null),
} as unknown as SuiteNetworkModules;

describe('createSuiteNetworkModuleRepository', () => {
    const repository = createSuiteNetworkModuleRepository({ suiteNetworkModules });

    it('finds the module registered for every symbol it supports', () => {
        expect(repository.get('btc' as never).signVerify).toBe(signVerify);
        expect(repository.get('ltc' as never).signVerify).toBe(signVerify);
    });

    it('hands back a module that neither signs nor verifies as such', () => {
        expect(repository.get('sol' as never).signVerify).toBeNull();
    });

    it('collects the supported networks of every registered module', () => {
        expect(repository.getSupportedNetworks()).toStrictEqual(['btc', 'ltc', 'sol']);
        expect(repository.isSupportedNetwork('ltc')).toBe(true);
        expect(repository.isSupportedNetwork('xrp')).toBe(false);
    });

    it('says which symbol has no module rather than handing back nothing', () => {
        expect(() => repository.get('xrp' as never)).toThrow(
            'Suite network module for xrp is not registered.',
        );
    });
});
