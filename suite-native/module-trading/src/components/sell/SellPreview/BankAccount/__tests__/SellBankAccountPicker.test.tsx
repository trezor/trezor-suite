import React from 'react';

import { type PreloadedState, renderWithStoreProvider } from '@suite-native/test-utils';
import { bankAccounts, getWalletState, verifiedBankAccount } from '@suite-native/trading-fixtures';

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
        it('should not render when no bank accounts are available', () => {
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

            const { queryByTestId } = renderWithStoreProvider(
                <SellBankAccountPicker
                    orderId="order_id_1"
                    selectedBankAccountIban=""
                    onBankAccountSelect={mockOnBankAccountSelect}
                />,
                { preloadedState },
            );

            expect(queryByTestId('@trading/sell/bank-account-item')).not.toBeOnTheScreen();
        });

        it('should not render when bankAccounts is undefined', () => {
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

            const { queryByTestId } = renderWithStoreProvider(
                <SellBankAccountPicker
                    orderId="order_id_1"
                    selectedBankAccountIban=""
                    onBankAccountSelect={mockOnBankAccountSelect}
                />,
                { preloadedState },
            );

            expect(queryByTestId('@trading/sell/bank-account-item')).not.toBeOnTheScreen();
        });

        it('should not render when orderId is undefined', () => {
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

            const { queryByTestId } = renderWithStoreProvider(
                <SellBankAccountPicker
                    orderId={undefined}
                    selectedBankAccountIban={verifiedBankAccount.bankAccount}
                    onBankAccountSelect={mockOnBankAccountSelect}
                />,
                { preloadedState },
            );

            expect(queryByTestId('@trading/sell/bank-account-item')).not.toBeOnTheScreen();
        });
    });
});
