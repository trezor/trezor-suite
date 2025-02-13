import { Account } from '@suite-common/wallet-types';
import { fireEvent, render } from '@suite-native/test-utils';
import { Address } from '@trezor/blockchain-link-types';

import { ReceiveAccountPicker, ReceiveAccountPickerProps } from '../ReceiveAccountPicker';

jest.mock('../../general/AccountSheet/AccountSheet');

describe('ReceiveAccountPicker', () => {
    const renderPicker = ({
        selectedSymbol,
        selectedValue,
        setSelectedValue = jest.fn(),
        isSheetVisible = false,
        hideSheet = jest.fn(),
        showSheet = jest.fn(),
    }: Partial<ReceiveAccountPickerProps>) =>
        render(
            <ReceiveAccountPicker
                selectedSymbol={selectedSymbol}
                isSheetVisible={isSheetVisible}
                hideSheet={hideSheet}
                showSheet={showSheet}
                setSelectedValue={setSelectedValue}
                selectedValue={selectedValue}
            />,
        );

    it('should display "Select coin first" when selectedSymbol is not specified', () => {
        const { getByText } = renderPicker({ selectedSymbol: undefined });

        expect(getByText('Select coin first')).toBeDefined();
    });

    it('should not call showSheet when selectedSymbol is not specified', () => {
        const showSheet = jest.fn();
        const { getByText } = renderPicker({ selectedSymbol: undefined, showSheet });

        fireEvent.press(getByText('Receive account'));

        expect(showSheet).not.toHaveBeenCalled();
    });

    it('should display "Not selected" when selectedValue is not specified', () => {
        const { getByText } = renderPicker({ selectedSymbol: 'btc', selectedValue: undefined });

        expect(getByText('Not selected')).toBeDefined();
    });

    it('should call showSheet when selectedSymbol is specified and picker pressed', () => {
        const showSheet = jest.fn();
        const { getByText } = renderPicker({ selectedSymbol: 'btc', showSheet });

        fireEvent.press(getByText('Receive account'));

        expect(showSheet).toHaveBeenCalledTimes(1);
    });

    it('should display selected account name', () => {
        const { getByText } = renderPicker({
            selectedSymbol: 'eth',
            selectedValue: {
                account: {
                    accountLabel: 'Account label',
                } as unknown as Account,
            },
        });

        expect(getByText('Account label')).toBeDefined();
    });

    it('should display selected account name and address', () => {
        const { getByText } = renderPicker({
            selectedSymbol: 'btc',
            selectedValue: {
                account: {
                    accountLabel: 'Account label',
                } as unknown as Account,
                address: {
                    address: 'Address',
                } as unknown as Address,
            },
        });

        expect(getByText('Account label')).toBeDefined();
        expect(getByText('Address')).toBeDefined();
    });
});
