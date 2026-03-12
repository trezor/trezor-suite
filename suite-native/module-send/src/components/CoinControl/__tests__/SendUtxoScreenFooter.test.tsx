import { renderWithStoreProviderAsync } from '@suite-native/test-utils/store';

import { SendUtxoScreenFooter } from '../SendUtxoScreenFooter';

jest.mock('../../../hooks/useUtxoSelection', () => ({
    useUtxoSelection: jest.fn(),
}));

describe('SendUtxosScreenFooter', () => {
    it('should render footer with selected total and continue button', async () => {
        const { getByText } = await renderWithStoreProviderAsync(
            <SendUtxoScreenFooter symbol="btc" selectedTotal="800000000" onSubmit={jest.fn()} />,
        );

        expect(getByText('Selected')).toBeTruthy();
        expect(getByText('8 BTC')).toBeTruthy();
        expect(getByText('Confirm selection')).toBeTruthy();
    });

    it('should show remaining amount when amount is provided and selected total is less than amount', async () => {
        const { getByText } = await renderWithStoreProviderAsync(
            <SendUtxoScreenFooter
                symbol="btc"
                selectedTotal="500000000"
                onSubmit={jest.fn()}
                amount="800000000"
            />,
        );

        expect(getByText('Remaining to select')).toBeTruthy();
        expect(getByText('3 BTC')).toBeTruthy(); // 800000000 - 500000000 = 300000000 (3 BTC)
    });

    it('should not show remaining amount when selected total is equal to or greater than amount', async () => {
        const { queryByText } = await renderWithStoreProviderAsync(
            <SendUtxoScreenFooter
                symbol="btc"
                selectedTotal="800000000"
                onSubmit={jest.fn()}
                amount="800000000"
            />,
        );

        expect(queryByText('Remaining to select')).toBeNull();
    });
});
