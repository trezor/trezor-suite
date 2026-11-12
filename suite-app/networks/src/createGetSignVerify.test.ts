import { asNetworkSymbol } from '@suite-common/wallet-config';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { createMockDeps } from '@trezor/dependency-injection';
import type { SignVerifyFeature, SuiteNetworkModule } from '@trezor/network-module-suite-types';

import { createSuiteNetworkModuleRepository } from './SuiteNetworkModuleRepository';
import { type GetSignVerifyDeps, createGetSignVerify } from './createGetSignVerify';

const BITCOIN_ACCOUNT = mockWalletAccount({ symbol: asNetworkSymbol('btc') });
const SOLANA_ACCOUNT = mockWalletAccount({ symbol: asNetworkSymbol('sol') });

const SIGN_VERIFY: SignVerifyFeature = { Component: () => null, title: 'TR_NAV_SIGN_VERIFY' };

const createBitcoinModule = () =>
    createMockDeps<SuiteNetworkModule>({
        getSupportedNetworks: () => [asNetworkSymbol('btc'), asNetworkSymbol('test')],
        getSignVerify: () => SIGN_VERIFY,
    });

describe(createGetSignVerify.name, () => {
    it('asks the module of the account network for the feature', () => {
        const bitcoinModule = createBitcoinModule();
        const deps: GetSignVerifyDeps = {
            suiteNetworkModuleRepository: createSuiteNetworkModuleRepository({
                suiteNetworkModules: [bitcoinModule],
            }),
        };

        expect(createGetSignVerify(deps)(BITCOIN_ACCOUNT)).toBe(SIGN_VERIFY);
        expect(bitcoinModule.getSignVerify).toHaveBeenCalledWith(BITCOIN_ACCOUNT);
    });

    it('has no feature for a network without a module', () => {
        const deps: GetSignVerifyDeps = {
            suiteNetworkModuleRepository: createSuiteNetworkModuleRepository({
                suiteNetworkModules: [createBitcoinModule()],
            }),
        };

        expect(createGetSignVerify(deps)(SOLANA_ACCOUNT)).toBeNull();
    });
});
