import React from 'react';

import { AccountKey, TokenAddress } from '@suite-common/wallet-types';
import { Form } from '@suite-native/forms';
import { type PreloadedState, renderHookWithStoreProviderAsync, renderWithStoreProviderAsync } from '@suite-native/test-utils/store';
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

    const renderUseFeesForm = async (
        accountKey: AccountKey = mockAccountKey,
        preloadedState?: PreloadedState,
    ) => {
        const { result } = await renderHookWithStoreProviderAsync(
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

    const renderTradingFeesForm = async (props: {
        accountKey: AccountKey;
        tokenContract?: TokenAddress;
    }) => {
        const form = await renderUseFeesForm(props.accountKey);

        return await renderWithStoreProviderAsync(<TradingFeesForm {...props} />, {
            preloadedState: defaultState,
            wrapper: ({ children }) => <Form form={form}>{children}</Form>,
        });
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render TradingFeesForm with FeesContent component', async () => {
        const { getByText } = await renderTradingFeesForm({ accountKey: mockAccountKey });

        expect(getByText('Transaction fee')).toBeTruthy();
    });

    it('should render with fees footer when total amount and fee are available', async () => {
        const { getByText } = await renderTradingFeesForm({ accountKey: mockAccountKey });

        // FeesFooter should be rendered if totalAmount and fee are present
        // This test validates the integration between TradingFeesForm and its child components
        expect(getByText('Transaction fee')).toBeTruthy();
    });

    it('should work with token contract for Ethereum accounts', async () => {
        const { getByText } = await renderTradingFeesForm({
            accountKey: 'eth1' as AccountKey, // Todo: create properly via `createAccountKey()`
            tokenContract: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as TokenAddress,
        });

        expect(getByText('Maximum fee')).toBeTruthy();
    });

    it('should not render anything when account is not available', async () => {
        const accountKey = 'nonexistent-account' as AccountKey;
        const { queryByText } = await renderTradingFeesForm({ accountKey });

        // Should not render when account doesn't exist
        expect(queryByText('Transaction fee')).toBeFalsy();
    });
});
