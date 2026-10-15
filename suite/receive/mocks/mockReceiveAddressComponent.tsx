import { type ReactElement } from 'react';
import { Provider } from 'react-redux';

import { configureStore } from '@reduxjs/toolkit';
import { render } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';

import { IntlProviderForTests, Translation } from '@suite/intl';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { AddressDisplayOptions } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { intermediaryTheme } from '@trezor/components';
import { ServicesProvider } from '@trezor/dependency-injection';

import { type ReceiveAddressItem } from '../src/address/buildReceiveAddressItems';

type MockLabelingProps = { displayValue: ReactElement };

// `jest.mock` is hoisted only within its own file, so each test file registers this through
// `jest.requireActual` itself; calling it here would run after the component already loaded labeling.
export const mockLabeling = {
    Labeling: ({ displayValue }: MockLabelingProps) => displayValue,
    selectIsLabelActionEnabled: () => false,
};

export const ADDRESS = 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq';
export const OBSCURED_ADDRESS = 'bc1qar0s...wf5mdq';

const account = mockWalletAccount({ symbol: asNetworkSymbol('btc') });
export const item: ReceiveAddressItem = {
    path: "m/84'/0'/0'/0/0",
    address: ADDRESS,
    pathIndex: 0,
    isFresh: false,
};

export const renderReceiveComponent = (component: ReactElement) => {
    const store = configureStore({
        reducer: () => ({
            wallet: {
                accounts: [account],
                settings: { addressDisplayType: AddressDisplayOptions.ORIGINAL },
            },
            receive: { accounts: {} },
            device: { selectedDevice: undefined },
        }),
    });
    const services = { store, analytics: { report: jest.fn() } };

    render(
        <Provider store={store}>
            <ServicesProvider services={services}>
                <ThemeProvider theme={{ ...intermediaryTheme.light, variant: 'light' }}>
                    <IntlProviderForTests>{component}</IntlProviderForTests>
                </ThemeProvider>
            </ServicesProvider>
        </Provider>,
    );
};

export const getReceiveDisabledProps = (isReceiveDisabled: boolean) => ({
    isReceiveDisabled,
    receiveDisabledReason: isReceiveDisabled ? (
        <Translation id="TR_RECEIVE_ADDRESS_SECURITY_CHECK_FAILED" />
    ) : null,
});

export const commonProps = {
    item,
    accountKey: account.key,
    disabled: false,
    isVerifyLoading: false,
    isVerifyDisabled: false,
    onCopied: jest.fn(),
    onVerify: jest.fn(),
};
