import React from 'react';

import { type PreloadedState, renderWithStoreProviderAsync } from '@suite-native/test-utils/store';
import { bankAccounts, getWalletState } from '@suite-native/trading-fixtures';

import { SellBankAccountPicker } from '../SellBankAccountPicker';

// Mock the SellBankAccountSheet component to isolate the picker component
jest.mock('../SellBankAccountSheet', () => ({
    SellBankAccountSheet: jest.fn().mockImplementation(() => <div>Bank Account Sheet</div>),
}));

describe('SellBankAccountPicker', () => {
    const mockOnBankAccountSelect = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Conditional Rendering', () => {
        it('should not render when no bank accounts are available', async () => {
            const preloadedState: PreloadedState = {
                wallet: getWalletState({ tradeType: 'sell' }),
            };

            preloadedState.wallet!.trading!.sell!.tradingAccountKey = 'eth-account-1';
            preloadedState.wallet!.trading!.trades = [
                {
                    tradeType: 'sell',
                    data: {
                        orderId: 'order_id_1',
                        bankAccounts: [], // No bank accounts
                    },
                },
            ];

            const { queryByTestId } = await renderWithStoreProviderAsync(
                <SellBankAccountPicker
                    orderId="order_id_1"
                    selectedBankAccountIban=""
                    onBankAccountSelect={mockOnBankAccountSelect}
                />,
                { preloadedState },
            );

            expect(queryByTestId('@trading/sell/bank-account-item')).not.toBeOnTheScreen();
        });

        it('should not render when bankAccounts is undefined', async () => {
            const preloadedState: PreloadedState = {
                wallet: getWalletState({ tradeType: 'sell' }),
            };

            preloadedState.wallet!.trading!.sell!.tradingAccountKey = 'eth-account-1';
            preloadedState.wallet!.trading!.trades = [
                {
                    tradeType: 'sell',
                    data: {
                        orderId: 'order_id_1',
                        bankAccounts: undefined, // Undefined bank accounts
                    },
                },
            ];

            const { queryByTestId } = await renderWithStoreProviderAsync(
                <SellBankAccountPicker
                    orderId="order_id_1"
                    selectedBankAccountIban=""
                    onBankAccountSelect={mockOnBankAccountSelect}
                />,
                { preloadedState },
            );

            expect(queryByTestId('@trading/sell/bank-account-item')).not.toBeOnTheScreen();
        });

        it('should not render when orderId is undefined', async () => {
            const preloadedState: PreloadedState = {
                wallet: getWalletState({ tradeType: 'sell' }),
            };

            preloadedState.wallet!.trading!.sell!.tradingAccountKey = 'eth-account-1';
            preloadedState.wallet!.trading!.trades = [
                {
                    tradeType: 'sell',
                    data: {
                        orderId: 'order_id_1',
                        bankAccounts,
                    },
                },
            ];

            const { queryByTestId } = await renderWithStoreProviderAsync(
                <SellBankAccountPicker
                    orderId={undefined}
                    selectedBankAccountIban={bankAccounts[0].bankAccount}
                    onBankAccountSelect={mockOnBankAccountSelect}
                />,
                { preloadedState },
            );

            expect(queryByTestId('@trading/sell/bank-account-item')).not.toBeOnTheScreen();
        });
    });
});
