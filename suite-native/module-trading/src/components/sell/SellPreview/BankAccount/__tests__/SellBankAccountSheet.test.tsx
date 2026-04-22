import React from 'react';

import { renderWithProviders, userEvent } from '@suite-native/test-utils';
import { bankAccounts, verifiedBankAccount } from '@suite-native/trading-fixtures';

import { SellBankAccountSheet } from '../SellBankAccountSheet';

describe('SellBankAccountSheet', () => {
    const mockOnBankAccountSelect = jest.fn();
    const mockCloseModal = jest.fn();
    const mockRef = { current: null };

    const renderSellBankAccountSheet = (props = {}) =>
        renderWithProviders(
            <SellBankAccountSheet
                ref={mockRef}
                bankAccounts={bankAccounts}
                selectedBankAccountIban={verifiedBankAccount.bankAccount}
                onBankAccountSelect={mockOnBankAccountSelect}
                closeModal={mockCloseModal}
                {...props}
            />,
            { providers: ['intl', 'bottomSheet'] },
        );

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('User Experience', () => {
        it('should display all bank accounts', () => {
            const { getByText } = renderSellBankAccountSheet();

            // User should see bank account holder names
            expect(getByText('John Doe')).toBeOnTheScreen();
            expect(getByText('Jane Smith')).toBeOnTheScreen();
            expect(getByText('Bob Johnson')).toBeOnTheScreen();
        });

        it('should allow user to select a bank account', async () => {
            const { getByText } = renderSellBankAccountSheet();

            // User should be able to tap on a bank account to select it
            await userEvent.press(getByText('John Doe'));

            expect(mockOnBankAccountSelect).toHaveBeenCalledWith(verifiedBankAccount);
        });

        it('should close the modal after user selects a bank account', async () => {
            const { getByText } = renderSellBankAccountSheet();

            // When user selects any bank account, modal should close
            await userEvent.press(getByText('Jane Smith'));

            expect(mockCloseModal).toHaveBeenCalledTimes(1);
        });
    });
});
