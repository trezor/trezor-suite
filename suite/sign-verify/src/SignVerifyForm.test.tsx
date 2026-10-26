import { Provider } from 'react-redux';

import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';

import {
    type GetNetworkDeps,
    createGetNetwork,
    createNetworkFamiliesCompositionRoot,
} from '@suite-common/networks';
import { mockNetworksServices } from '@suite-common/networks/mocks';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type Account, AddressDisplayOptions } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { IntlProviderForTests, messages } from '@suite-lego/intl';
import { intermediaryTheme } from '@trezor/components';
import { ServicesProvider, asGetter, createMockDeps } from '@trezor/dependency-injection';
import type { NetworkSuiteCommonModuleApi } from '@trezor/network-module-suite-common-types';

import { SignVerifyForm } from './SignVerifyForm';

// The tabs measure themselves, which jsdom cannot do.
global.ResizeObserver = class MockedResizeObserver {
    observe = jest.fn();
    unobserve = jest.fn();
    disconnect = jest.fn();
};

const getNetwork = createGetNetwork({
    networkFamilies: createNetworkFamiliesCompositionRoot(
        createMockDeps<NetworkSuiteCommonModuleApi>({ getTrezorConnect: null }),
    ),
    getNetworkBackend: asGetter(() => 'blockbook'),
} satisfies GetNetworkDeps);

const addresses = {
    unused: [
        {
            path: "m/0'/0'/0'/0/1",
            address: 'fresh-address',
            transfers: 0,
            balance: '0',
            sent: '0',
            received: '0',
        },
    ],
    used: [],
    change: [],
};

const renderForm = (account: Account) => {
    const messageSigning = getNetwork({ symbol: account.symbol, accountType: account.accountType })
        ?.capabilities.messageSigning;

    if (messageSigning === undefined) {
        throw new Error(`${account.symbol} is expected to sign messages.`);
    }

    const store = configureStore({
        reducer: () => ({
            wallet: { settings: { addressDisplayType: AddressDisplayOptions.ORIGINAL } },
            receive: { accounts: {} },
            device: { selectedDevice: undefined },
        }),
    });
    const services = { store, dispatch: store.dispatch, networks: mockNetworksServices() };

    render(
        <Provider store={store}>
            <ServicesProvider services={services}>
                <ThemeProvider theme={{ ...intermediaryTheme.light, variant: 'light' }}>
                    <IntlProviderForTests>
                        <SignVerifyForm
                            account={account}
                            messageSigning={messageSigning}
                            isDeviceLocked={false}
                            page="sign"
                            onPageChange={jest.fn()}
                        />
                    </IntlProviderForTests>
                </ThemeProvider>
            </ServicesProvider>
        </Provider>,
    );
};

describe(SignVerifyForm.name, () => {
    it('offers Bitcoin its signature formats and verification', () => {
        renderForm(mockWalletAccount({ symbol: asNetworkSymbol('btc'), addresses }));

        expect(screen.getByTestId('@sign-verify/format')).toBeTruthy();
        expect(
            screen.getAllByText(messages.TR_COMPATIBILITY_SIG_FORMAT.defaultMessage),
        ).not.toHaveLength(0);
        expect(screen.getByTestId('@sign-verify/navigation/verify')).toBeTruthy();
        expect(screen.queryByTestId('@sign-verify/pubKey')).toBeNull();
    });

    it('signs Ethereum with the account address and no format to choose', () => {
        renderForm(mockWalletAccount({ symbol: asNetworkSymbol('eth') }));

        expect(screen.queryByTestId('@sign-verify/format')).toBeNull();
        expect(screen.getByTestId('@sign-verify/navigation/verify')).toBeTruthy();
    });

    it('offers Cardano its public key formats and no verification', () => {
        renderForm(
            mockWalletAccount(
                { symbol: asNetworkSymbol('ada'), addresses },
                { misc: { staking: { address: 'stake-address' } } },
            ),
        );

        expect(screen.getByTestId('@sign-verify/cardano-pubkey-format')).toBeTruthy();
        expect(screen.getAllByText(messages.TR_PUBLIC_KEY_COSE.defaultMessage)).not.toHaveLength(0);
        expect(screen.getByTestId('@sign-verify/pubKey')).toBeTruthy();
        expect(screen.queryByTestId('@sign-verify/navigation/verify')).toBeNull();
    });
});
