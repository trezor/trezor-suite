import { Network } from '@suite-common/wallet-config';
import { fireEvent, renderWithStoreProviderAsync } from '@suite-native/test-utils';

import { TradeableAssetsSheetHeader } from '../TradeableAssetsSheetHeader';

jest.mock('@suite-native/discovery', () => {
    const networks: Network[] = [];

    return {
        ...jest.requireActual('@suite-native/discovery'),
        selectDiscoverySupportedNetworks: () => networks,
    };
});

describe('TradeableAssetsSheetHeader', () => {
    const renderComponent = (onClose = jest.fn()) =>
        renderWithStoreProviderAsync(
            <TradeableAssetsSheetHeader
                onClose={onClose}
                onFilterChange={jest.fn()}
                onSelectedNetworkFilter={jest.fn()}
            />,
        );

    it('should display "Coins" and do not display tabs by default', async () => {
        const { getByText, queryByText } = await renderComponent();

        expect(getByText('Assets')).toBeTruthy();
        expect(queryByText('All')).toBeNull();
    });

    it('should display tabs after focusing search input', async () => {
        const { getByPlaceholderText, getByText, queryByText } = await renderComponent();

        fireEvent(getByPlaceholderText(/Search/), 'focus');

        expect(getByText('All')).toBeTruthy();
        expect(queryByText('Coins')).toBeNull();
    });

    it('should not display cancel button by default', async () => {
        const { queryByText } = await renderComponent();

        expect(queryByText('Cancel')).toBeNull();
    });

    it('should display cancel button after focusing search input', async () => {
        const { getByPlaceholderText, getByText } = await renderComponent();

        fireEvent(getByPlaceholderText(/Search/), 'focus');

        expect(getByText('Cancel')).toBeTruthy();
    });

    it('should call onClose when close button is pressed ', async () => {
        const onClose = jest.fn();
        const { getByLabelText } = await renderComponent(onClose);

        fireEvent.press(getByLabelText('Close'));

        expect(onClose).toHaveBeenCalled();
    });
});
