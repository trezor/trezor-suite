import { Provider } from 'react-redux';

import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';

import { IntlProviderForTests, messages } from '@suite/intl';
import {
    type GetNetworkDeps,
    createGetNetwork,
    createNetworkFamiliesCompositionRoot,
} from '@suite-common/networks';
import { mockNetworksServices } from '@suite-common/networks/mocks';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type Account, AddressDisplayOptions } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { intermediaryTheme } from '@trezor/components';
import { ServicesProvider, asGetter, createMockDeps } from '@trezor/dependency-injection';
import type { NetworkSuiteCommonModuleApi } from '@trezor/network-module-suite-common-types';

import { SignVerify, type SignVerifyOverrideProps, type SignVerifyOverrides } from './SignVerify';

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

const renderSignVerify = (account: Account, overrides?: SignVerifyOverrides) => {
    const store = configureStore({
        reducer: () => ({
            wallet: { settings: { addressDisplayType: AddressDisplayOptions.ORIGINAL } },
            receive: { accounts: {} },
            device: { selectedDevice: undefined },
            locks: {},
        }),
    });
    const services = {
        store,
        dispatch: store.dispatch,
        networks: mockNetworksServices({ getNetwork }),
    };

    render(
        <Provider store={store}>
            <ServicesProvider services={services}>
                <ThemeProvider theme={{ ...intermediaryTheme.light, variant: 'light' }}>
                    <IntlProviderForTests>
                        <SignVerify
                            account={account}
                            overrides={overrides}
                            renderShell={({ title, children }) => (
                                <section aria-label={title}>{children}</section>
                            )}
                        />
                    </IntlProviderForTests>
                </ThemeProvider>
            </ServicesProvider>
        </Provider>,
    );
};

const bitcoinAccount = () => mockWalletAccount({ symbol: asNetworkSymbol('btc'), addresses });

describe(SignVerify.name, () => {
    it('offers Bitcoin its signature formats and verification', () => {
        renderSignVerify(bitcoinAccount());

        expect(screen.getByTestId('@sign-verify/format')).toBeTruthy();
        expect(
            screen.getAllByText(messages.TR_COMPATIBILITY_SIG_FORMAT.defaultMessage),
        ).not.toHaveLength(0);
        expect(screen.getByTestId('@sign-verify/navigation/verify')).toBeTruthy();
        expect(screen.queryByTestId('@sign-verify/pubKey')).toBeNull();
    });

    it('signs Ethereum with the account address and no format to choose', () => {
        renderSignVerify(mockWalletAccount({ symbol: asNetworkSymbol('eth') }));

        expect(screen.queryByTestId('@sign-verify/format')).toBeNull();
        expect(screen.getByTestId('@sign-verify/navigation/verify')).toBeTruthy();
    });

    it('offers Cardano its public key formats and no verification', () => {
        renderSignVerify(
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

    it('lets an override decorate the default form with the same signing', () => {
        const received: SignVerifyOverrideProps[] = [];
        const BitcoinOverride = (props: SignVerifyOverrideProps) => {
            received.push(props);
            const { DefaultForm, ...formProps } = props;

            return (
                <>
                    <p>Bitcoin notice</p>
                    <DefaultForm {...formProps} />
                </>
            );
        };

        renderSignVerify(bitcoinAccount(), { bitcoin: BitcoinOverride });

        expect(screen.getByText('Bitcoin notice')).toBeTruthy();
        expect(screen.getByTestId('@sign-verify/format')).toBeTruthy();
        expect(received[0]?.signing.family).toBe('bitcoin');
        expect(received[0]?.signing.canVerify).toBe(true);
    });

    it('keeps the default form for families without an override', () => {
        renderSignVerify(mockWalletAccount({ symbol: asNetworkSymbol('eth') }), {
            bitcoin: () => <p>Bitcoin notice</p>,
        });

        expect(screen.queryByText('Bitcoin notice')).toBeNull();
        expect(screen.getByTestId('@sign-verify/submit')).toBeTruthy();
    });
});
