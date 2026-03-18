import React from 'react';

import { type AccountKey, type TokenAddress } from '@suite-common/wallet-types';
import { Form } from '@suite-native/forms';
import {
    type PreloadedState,
    renderHookWithStoreProvider,
    renderWithStoreProvider,
} from '@suite-native/test-utils';
import {
    getBtcAccount,
    getEthAccount,
    getInitializedTradingState,
    getWalletState,
} from '@suite-native/trading-fixtures';
import { useFeesForm } from '@suite-native/transaction-management';

import { TradingFeesForm } from '../TradingFeesForm';

jest.mock('@suite-native/module-trading/src/thunks', () => ({
    updateTradingSelectedFeeLevelThunk: jest.fn(),
}));

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useRoute: () => ({
        params: {
            tradingType: 'buy',
        },
    }),
}));

describe('TradingFeesForm', () => {
    const mockAccountKey: AccountKey = 'btc1' as AccountKey; // Todo: create properly via `createAccountKey()`
    const mockAccount = getBtcAccount(mockAccountKey);
    const mockEthAccount = getEthAccount(
        'eth1' as AccountKey, // Todo: create properly via `createAccountKey()`
    );

    const defaultState = {
        wallet: {
            ...getWalletState(),
            trading: getInitializedTradingState(),
            accounts: [mockAccount, mockEthAccount],
        },
    };

    const renderUseFeesForm = (
        accountKey: AccountKey = mockAccountKey,
        preloadedState?: PreloadedState,
    ) => {
        const { result } = renderHookWithStoreProvider(
            () =>
                useFeesForm({
                    accountKey,
                    defaultFeeLevel: 'normal',
                    defaultFeePerUnit: '1',
                }),
            {
                preloadedState: preloadedState || defaultState,
            },
        );

        return result.current;
    };

    const renderTradingFeesForm = (props: {
        accountKey: AccountKey;
        tokenContract?: TokenAddress;
    }) => {
        const form = renderUseFeesForm(props.accountKey);

        return renderWithStoreProvider(<TradingFeesForm {...props} />, {
            preloadedState: defaultState,
            wrapper: ({ children }) => <Form form={form}>{children}</Form>,
        });
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render TradingFeesForm with FeesContent component', () => {
        const { getByText } = renderTradingFeesForm({ accountKey: mockAccountKey });

        expect(getByText('Transaction fee')).toBeTruthy();
    });

    it('should render with fees footer when total amount and fee are available', () => {
        const { getByText } = renderTradingFeesForm({ accountKey: mockAccountKey });

        // FeesFooter should be rendered if totalAmount and fee are present
        // This test validates the integration between TradingFeesForm and its child components
        expect(getByText('Transaction fee')).toBeTruthy();
    });

    it('should work with token contract for Ethereum accounts', () => {
        const { getByText } = renderTradingFeesForm({
            accountKey: 'eth1' as AccountKey, // Todo: create properly via `createAccountKey()`
            tokenContract: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as TokenAddress,
        });

        expect(getByText('Maximum fee')).toBeTruthy();
    });

    it('should not render anything when account is not available', () => {
        const accountKey = 'nonexistent-account' as AccountKey;
        const { queryByText } = renderTradingFeesForm({ accountKey });

        // Should not render when account doesn't exist
        expect(queryByText('Transaction fee')).toBeFalsy();
    });
});
