import { asNetworkSymbols } from '@trezor/network-module';
import type { SuiteNetworkModule } from '@trezor/network-module-suite-types';

import { createSuiteNetworkModuleRepository } from './SuiteNetworkModuleRepository';
import type { SuiteNetworkModules } from './SuiteNetworkModules';

const signVerify = {
    Component: () => null,
    title: 'TR_NAV_SIGN_VERIFY',
} as NonNullable<SuiteNetworkModule['signVerify']>;

const createModule = (
    symbols: string[],
    module: SuiteNetworkModule['signVerify'],
): SuiteNetworkModule => ({
    signVerify: module,
    getSupportedNetworks: () => asNetworkSymbols(symbols),
});

const suiteNetworkModules = {
    bitcoin: createModule(['btc', 'ltc'], signVerify),
    solana: createModule(['sol'], null),
} as unknown as SuiteNetworkModules;

describe('createSuiteNetworkModuleRepository', () => {
    const repository = createSuiteNetworkModuleRepository({ suiteNetworkModules });

    it('finds the module registered for every symbol it supports', () => {
        expect(repository.get(asNetworkSymbols(['btc'])[0]!).signVerify).toBe(signVerify);
        expect(repository.get(asNetworkSymbols(['ltc'])[0]!).signVerify).toBe(signVerify);
    });

    it('hands back a module that neither signs nor verifies as such', () => {
        expect(repository.get(asNetworkSymbols(['sol'])[0]!).signVerify).toBeNull();
    });

    it('collects the supported networks of every registered module', () => {
        expect(repository.getSupportedNetworks()).toStrictEqual(['btc', 'ltc', 'sol']);
        expect(repository.isSupportedNetwork('ltc')).toBe(true);
        expect(repository.isSupportedNetwork('xrp')).toBe(false);
    });

    it('says which symbol has no module rather than handing back nothing', () => {
        expect(() => repository.get(asNetworkSymbols(['xrp'])[0]!)).toThrow(
            'Suite network module for xrp is not registered.',
        );
    });
});
