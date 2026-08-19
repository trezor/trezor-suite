import type { ComponentProps } from 'react';

import { type TradingTransaction } from '@suite-common/trading';
import {
    bankAccounts,
    eth1NormalAccount,
    verifiedBankAccount,
} from '@suite-native/trading-fixtures';

import { SellBankAccountPicker } from './SellBankAccountPicker';
import {
    type PreloadedStatePartial,
    type TradingTestPreloadedState,
    renderWithTradingProvider,
} from '../../../../test-utils/tradingTestUtils';

// Mock the sheet to isolate the picker behavior.
jest.mock('./SellBankAccountSheet', () => ({
    SellBankAccountSheet: jest.fn().mockImplementation(() => <div>Bank Account Sheet</div>),
}));

describe('SellBankAccountPicker', () => {
    const mockSelectBankAccount = jest.fn();
    type SellTradingTransaction = Extract<TradingTransaction, { tradeType: 'sell' }>;

    const getTrade = (
        bankAccountsValue: SellTradingTransaction['data']['bankAccounts'],
    ): SellTradingTransaction => ({
        tradeType: 'sell',
        date: '2024-01-01T00:00:00.000Z',
        sendAccountKey: eth1NormalAccount.key,
        data: {
            orderId: 'order_id_1',
            bankAccounts: bankAccountsValue,
        },
    });

    const renderPicker = (
        props: ComponentProps<typeof SellBankAccountPicker>,
        overrides: PreloadedStatePartial<TradingTestPreloadedState>,
    ) =>
        renderWithTradingProvider(<SellBankAccountPicker {...props} />, {
            tradeType: 'sell',
            overrides,
        });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Conditional Rendering', () => {
        it('should not render when no bank accounts are available', () => {
            const { queryByTestId } = renderPicker(
                {
                    orderId: 'order_id_1',
                    selectedBankAccountIban: '',
                    onBankAccountSelect: mockSelectBankAccount,
                },
                {
                    wallet: {
                        trading: {
                            sell: { tradingAccountKey: eth1NormalAccount.key },
                            trades: [getTrade([])],
                        },
                    },
                },
            );

            expect(queryByTestId('@trading/sell/bank-account-item')).not.toBeOnTheScreen();
        });

        it('should not render when bankAccounts is undefined', () => {
            const { queryByTestId } = renderPicker(
                {
                    orderId: 'order_id_1',
                    selectedBankAccountIban: '',
                    onBankAccountSelect: mockSelectBankAccount,
                },
                {
                    wallet: {
                        trading: {
                            sell: { tradingAccountKey: eth1NormalAccount.key },
                            trades: [getTrade(undefined)],
                        },
                    },
                },
            );

            expect(queryByTestId('@trading/sell/bank-account-item')).not.toBeOnTheScreen();
        });

        it('should not render when orderId is undefined', () => {
            const { queryByTestId } = renderPicker(
                {
                    orderId: undefined,
                    selectedBankAccountIban: verifiedBankAccount.bankAccount,
                    onBankAccountSelect: mockSelectBankAccount,
                },
                {
                    wallet: {
                        trading: {
                            sell: { tradingAccountKey: eth1NormalAccount.key },
                            trades: [getTrade(bankAccounts)],
                        },
                    },
                },
            );

            expect(queryByTestId('@trading/sell/bank-account-item')).not.toBeOnTheScreen();
        });
    });
});
