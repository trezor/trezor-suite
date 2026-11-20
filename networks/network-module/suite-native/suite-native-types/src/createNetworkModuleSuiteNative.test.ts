import { isValidElement } from 'react';

import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { createNetworkModule } from '@trezor/network-module-suite-common-types';
import { asNetworkSymbol } from '@trezor/network-module-types';

import type { SignVerify, SignVerifyProps } from './SignVerify';
import {
    type NetworkModuleSuiteNativeDefinition,
    createNetworkModuleSuiteNative,
} from './createNetworkModuleSuiteNative';

const supportedNetworks = ['aaa', 'taaa'] as const;
const common = createNetworkModule(supportedNetworks, {
    icon: {
        getIcons: () => ({ coin: 'coin.svg', network: 'network.svg' }),
        getIconPaths: () => ({ coin: 'coin.svg', network: 'network.svg' }),
    },
    addressValidator: {
        isAddressValid: () => true,
        getAddressType: () => undefined,
    },
    getAccountSyncInterval: () => 60_000,
    getNetworkConfig: () => {
        throw new Error('Network config is not used by these tests.');
    },
});
const account = {
    ...mockWalletAccount({ symbol: asNetworkSymbol('btc') }),
    symbol: asNetworkSymbol('aaa'),
};
const foreignAccount = { ...account, symbol: asNetworkSymbol('zzz') };
const signVerify: SignVerify<'aaa' | 'taaa'> = {
    Component: () => null,
};
const definition: NetworkModuleSuiteNativeDefinition<'aaa' | 'taaa'> = { signVerify };

describe(createNetworkModuleSuiteNative.name, () => {
    it('advertises its supported networks and keeps one feature and component', () => {
        const networkModule = createNetworkModuleSuiteNative(common, supportedNetworks, definition);

        expect(networkModule.getSupportedNetworks()).toEqual(supportedNetworks);
        const feature = networkModule.getSignVerify(account);
        expect(feature).not.toBeNull();
        expect(networkModule.getSignVerify(account)).toBe(feature);
        expect(networkModule.getSignVerify({ ...account, symbol: asNetworkSymbol('taaa') })).toBe(
            feature,
        );
    });

    it('has no feature for foreign networks or a module without Sign & Verify', () => {
        expect(
            createNetworkModuleSuiteNative(common, supportedNetworks, definition).getSignVerify(
                foreignAccount,
            ),
        ).toBeNull();
        expect(
            createNetworkModuleSuiteNative(common, supportedNetworks, {}).getSignVerify(account),
        ).toBeNull();
    });

    it('passes the account to the network component with its symbol narrowed', () => {
        const feature = createNetworkModuleSuiteNative(
            common,
            supportedNetworks,
            definition,
        ).getSignVerify(account);
        if (!feature) throw new Error('Expected Sign & Verify.');

        const element: unknown = Reflect.apply(feature.Component, undefined, [{ account }]);
        if (!isValidElement<SignVerifyProps<'aaa' | 'taaa'>>(element)) {
            throw new Error('Expected the network component.');
        }
        expect(element.type).toBe(signVerify.Component);
        expect(element.props.account).toEqual(account);
    });

    it('rejects a foreign account before rendering the network component', () => {
        const feature = createNetworkModuleSuiteNative(
            common,
            supportedNetworks,
            definition,
        ).getSignVerify(account);
        if (!feature) throw new Error('Expected Sign & Verify.');

        expect(() =>
            Reflect.apply(feature.Component, undefined, [{ account: foreignAccount }]),
        ).toThrow('Unsupported network symbol: zzz');
    });
});
