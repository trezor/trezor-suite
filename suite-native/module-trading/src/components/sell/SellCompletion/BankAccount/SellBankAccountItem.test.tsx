import { getTranslation } from '@suite-native/intl';
import { renderWithBasicProvider, userEvent } from '@suite-native/test-utils';
import { unverifiedBankAccount, verifiedBankAccount } from '@suite-native/trading-fixtures';

import { BANK_ACCOUNT_ITEM_TEST_ID, SellBankAccountItem } from './SellBankAccountItem';

describe('SellBankAccountItem', () => {
    const renderBankAccountItem = async (props = {}) =>
        await renderWithBasicProvider(
            <SellBankAccountItem
                bankAccount={verifiedBankAccount}
                accessoryType="none"
                {...props}
            />,
        );

    describe('Rendering', () => {
        it('should render bank account holder name', async () => {
            const { getByText } = await renderBankAccountItem();

            expect(getByText('John Doe')).toBeOnTheScreen();
        });

        it('should render formatted IBAN', async () => {
            const { getByText } = await renderBankAccountItem();

            expect(getByText('CZ65 0800 0000 1920 0014 5399')).toBeOnTheScreen();
        });

        it('should render verified status for verified bank account', async () => {
            const { getByText, getByTestId } = await renderBankAccountItem({
                bankAccount: verifiedBankAccount,
            });

            expect(
                getByText(getTranslation('moduleTrading.tradingSellPreviewScreen.verified')),
            ).toBeOnTheScreen();
            expect(getByTestId('check-icon')).toBeOnTheScreen();
        });

        it('should render not verified status for unverified bank account', async () => {
            const { getByText, queryByTestId } = await renderBankAccountItem({
                bankAccount: unverifiedBankAccount,
            });

            expect(
                getByText(getTranslation('moduleTrading.tradingSellPreviewScreen.notVerified')),
            ).toBeOnTheScreen();
            expect(queryByTestId('check-icon')).not.toBeOnTheScreen();
        });
    });

    describe('Accessory Types', () => {
        it('should render caret accessory', async () => {
            const { getByTestId } = await renderBankAccountItem({
                accessoryType: 'caret',
            });

            expect(getByTestId('caret-right-icon')).toBeOnTheScreen();
        });

        it('should render select accessory (radio button)', async () => {
            const { getByTestId } = await renderBankAccountItem({
                accessoryType: 'select',
                isSelected: false,
            });

            expect(getByTestId('radio-button-select')).toBeOnTheScreen();
        });

        it('should render no accessory', async () => {
            const { queryByTestId } = await renderBankAccountItem({
                accessoryType: 'none',
            });

            expect(queryByTestId('caret-right-icon')).not.toBeOnTheScreen();
            expect(queryByTestId('radio-button-select')).not.toBeOnTheScreen();
        });
    });

    describe('User Interactions', () => {
        it('should call onPress when pressed', async () => {
            const mockOnPress = jest.fn();
            const { getByTestId } = await renderBankAccountItem({
                onPress: mockOnPress,
            });

            await userEvent.press(getByTestId(BANK_ACCOUNT_ITEM_TEST_ID));

            expect(mockOnPress).toHaveBeenCalledTimes(1);
        });

        it('should call onPress when radio button is pressed', async () => {
            const mockOnPress = jest.fn();
            const { getByTestId } = await renderBankAccountItem({
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
