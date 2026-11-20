import { asNetworkSymbol } from '@suite-common/wallet-config';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { createMockDeps } from '@trezor/dependency-injection';
import {
    type SignVerify,
    type SuiteNativeNetworkModule,
    createNetworkModuleSuiteNative,
} from '@trezor/network-module-suite-native-types';

import { createSuiteNativeNetworkModuleRepository } from './SuiteNativeNetworkModuleRepository';
import { type GetSignVerifyDeps, createGetSignVerify } from './createGetSignVerify';

const BITCOIN_ACCOUNT = mockWalletAccount({ symbol: asNetworkSymbol('btc') });
const SOLANA_ACCOUNT = mockWalletAccount({ symbol: asNetworkSymbol('sol') });

const SIGN_VERIFY: SignVerify = { Component: () => null };

const createBitcoinModule = () =>
    createMockDeps<SuiteNativeNetworkModule>({
        getSupportedNetworks: () => [asNetworkSymbol('btc'), asNetworkSymbol('test')],
        getSignVerify: () => SIGN_VERIFY,
    });

describe(createGetSignVerify.name, () => {
    it('asks the module of the account network for its Sign & Verify', () => {
        const bitcoinModule = createBitcoinModule();
        const deps: GetSignVerifyDeps = {
            suiteNativeNetworkModuleRepository: createSuiteNativeNetworkModuleRepository({
                suiteNativeNetworkModules: [bitcoinModule],
            }),
        };

        expect(createGetSignVerify(deps)(BITCOIN_ACCOUNT)).toBe(SIGN_VERIFY);
        expect(bitcoinModule.getSignVerify).toHaveBeenCalledWith(BITCOIN_ACCOUNT);
    });

    it('has no Sign & Verify for a registered network without the feature', () => {
        const deps: GetSignVerifyDeps = {
            suiteNativeNetworkModuleRepository: createSuiteNativeNetworkModuleRepository({
                suiteNativeNetworkModules: [
                    createBitcoinModule(),
                    createNetworkModuleSuiteNative(['sol'], {}),
                ],
            }),
        };

        expect(createGetSignVerify(deps)(SOLANA_ACCOUNT)).toBeNull();
    });

    it('throws when an account has no registered network module', () => {
        const deps: GetSignVerifyDeps = {
            suiteNativeNetworkModuleRepository: createSuiteNativeNetworkModuleRepository({
                suiteNativeNetworkModules: [],
            }),
        };
        expect(() => createGetSignVerify(deps)(BITCOIN_ACCOUNT)).toThrow(
            'Network module for btc is not registered.',
        );
    });
});
