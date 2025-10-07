import React from 'react';

import { AccountKey, TokenAddress } from '@suite-common/wallet-types';
import { Form } from '@suite-native/forms';
import {
    PreloadedState,
    renderHookWithStoreProviderAsync,
    renderWithStoreProviderAsync,
} from '@suite-native/test-utils';
import { useFeesForm } from '@suite-native/transaction-management';
import { getWalletState } from '@suite-native/transaction-management/src/__fixtures__/walletState';

import { getBtcAccount, getEthAccount } from '../../../__fixtures__/account';
import { getInitializedTradingState } from '../../../__fixtures__/tradingState';
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
    const mockAccountKey: AccountKey = 'btc1';
    const mockAccount = getBtcAccount(mockAccountKey);
    const mockEthAccount = getEthAccount('eth1');

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

    it('should render fees form with title and description', async () => {
        const { getByText } = await renderTradingFeesForm({ accountKey: mockAccountKey });

        expect(getByText('Transaction fee')).toBeTruthy();
        expect(
            getByText('Fees are paid directly to validators for processing your transactions.'),
        ).toBeTruthy();
    });

    it('should render fee options list when selected fee level is not custom', async () => {
        const { getByTestId } = await renderTradingFeesForm({ accountKey: mockAccountKey });

        // The component should render FeeOptionsList when fee level is not custom
        expect(getByTestId('@transactionManagement/fees-level-container-normal')).toBeTruthy();
    });

    it('should render custom fee wrapper', async () => {
        const { getByTestId } = await renderTradingFeesForm({ accountKey: mockAccountKey });

        // The component should always render CustomFee wrapper
        expect(getByTestId('@transactionManagement/fees-level-custom')).toBeTruthy();
    });

    it('should work with token contract for Ethereum accounts', async () => {
        const { getByText } = await renderTradingFeesForm({
            accountKey: 'eth1',
            tokenContract: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as TokenAddress,
        });

        expect(getByText('Transaction fee')).toBeTruthy();
    });

    it('should not render anything when account is not available', async () => {
        const accountKey = 'nonexistent-account' as AccountKey;
        const { queryByText } = await renderTradingFeesForm({ accountKey });

        // Should not render when account doesn't exist
        expect(queryByText('Transaction fee')).toBeFalsy();
    });
});
