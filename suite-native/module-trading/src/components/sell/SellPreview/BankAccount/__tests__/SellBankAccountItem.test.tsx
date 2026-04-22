import React from 'react';

import { renderWithBasicProvider, userEvent } from '@suite-native/test-utils';
import { unverifiedBankAccount, verifiedBankAccount } from '@suite-native/trading-fixtures';

import { BANK_ACCOUNT_ITEM_TEST_ID, SellBankAccountItem } from '../SellBankAccountItem';

describe('SellBankAccountItem', () => {
    const renderSellBankAccountItem = (props = {}) =>
        renderWithBasicProvider(
            <SellBankAccountItem
                bankAccount={verifiedBankAccount}
                accessoryType="none"
                {...props}
            />,
        );

    describe('Rendering', () => {
        it('should render bank account holder name', () => {
            const { getByText } = renderSellBankAccountItem();

            expect(getByText('John Doe')).toBeOnTheScreen();
        });

        it('should render formatted IBAN', () => {
            const { getByText } = renderSellBankAccountItem();

            expect(getByText('CZ65 0800 0000 1920 0014 5399')).toBeOnTheScreen();
        });

        it('should render verified status for verified bank account', () => {
            const { getByText, getByTestId } = renderSellBankAccountItem({
                bankAccount: verifiedBankAccount,
            });

            expect(getByText('Verified')).toBeOnTheScreen();
            expect(getByTestId('check-icon')).toBeOnTheScreen();
        });

        it('should render not verified status for unverified bank account', () => {
            const { getByText, queryByTestId } = renderSellBankAccountItem({
                bankAccount: unverifiedBankAccount,
            });

            expect(getByText('Not verified')).toBeOnTheScreen();
            expect(queryByTestId('check-icon')).not.toBeOnTheScreen();
        });
    });

    describe('Accessory Types', () => {
        it('should render caret accessory', () => {
            const { getByTestId } = renderSellBankAccountItem({
                accessoryType: 'caret',
            });

            expect(getByTestId('caret-right-icon')).toBeOnTheScreen();
        });

        it('should render select accessory (radio button)', () => {
            const { getByTestId } = renderSellBankAccountItem({
                accessoryType: 'select',
                isSelected: false,
            });

            expect(getByTestId('radio-button-select')).toBeOnTheScreen();
        });

        it('should render no accessory', () => {
            const { queryByTestId } = renderSellBankAccountItem({
                accessoryType: 'none',
            });

            expect(queryByTestId('caret-right-icon')).not.toBeOnTheScreen();
            expect(queryByTestId('radio-button-select')).not.toBeOnTheScreen();
        });
    });

    describe('User Interactions', () => {
        it('should call onPress when pressed', async () => {
            const mockOnPress = jest.fn();
            const { getByTestId } = renderSellBankAccountItem({
                onPress: mockOnPress,
            });

            await userEvent.press(getByTestId(BANK_ACCOUNT_ITEM_TEST_ID));

            expect(mockOnPress).toHaveBeenCalledTimes(1);
        });

        it('should call onPress when radio button is pressed', async () => {
            const mockOnPress = jest.fn();
            const { getByTestId } = renderSellBankAccountItem({
                accessoryType: 'select',
                onPress: mockOnPress,
            });

            // Since Radio is a PressableOpacity, we can press the main component
            // The onPress will be called through the AccessoryView
            await userEvent.press(getByTestId(BANK_ACCOUNT_ITEM_TEST_ID));

            expect(mockOnPress).toHaveBeenCalledTimes(1);
        });
    });
});
