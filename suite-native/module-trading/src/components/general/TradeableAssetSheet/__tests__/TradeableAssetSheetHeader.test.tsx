import { type Network } from '@suite-common/wallet-config';
import { fireEvent, renderWithStoreProvider } from '@suite-native/test-utils-store';

import { TradeableAssetSheetHeader } from '../TradeableAssetSheetHeader';

jest.mock('@suite-native/discovery', () => {
    const networks: Network[] = [];

    return {
        ...jest.requireActual('@suite-native/discovery'),
        selectDiscoverySupportedNetworks: () => networks,
    };
});

describe('TradeableAssetSheetHeader', () => {
    const renderComponent = (onClose = jest.fn()) =>
        renderWithStoreProvider(
            <TradeableAssetSheetHeader
                onClose={onClose}
                onFilterChange={jest.fn()}
                onSelectedNetworkFilter={jest.fn()}
            />,
            { providers: ['intl'] },
        );

    it('should display "Coins" and do not display tabs by default', () => {
        const { getByText, queryByText } = renderComponent();

        expect(getByText('Assets')).toBeTruthy();
        expect(queryByText('All')).toBeNull();
    });

    it('should display tabs after focusing search input', () => {
        const { getByPlaceholderText, getByText, queryByText } = renderComponent();

        fireEvent(getByPlaceholderText(/Search/), 'focus');

        expect(getByText('All')).toBeTruthy();
        expect(queryByText('Coins')).toBeNull();
    });

    it('should not display cancel button by default', () => {
        const { queryByText } = renderComponent();

        expect(queryByText('Cancel')).toBeNull();
    });

    it('should display cancel button after focusing search input', () => {
        const { getByPlaceholderText, getByText } = renderComponent();

        fireEvent(getByPlaceholderText(/Search/), 'focus');

        expect(getByText('Cancel')).toBeTruthy();
    });

    it('should call onClose when close button is pressed ', () => {
        const onClose = jest.fn();
        const { getByLabelText } = renderComponent(onClose);

        fireEvent.press(getByLabelText('Close'));

        expect(onClose).toHaveBeenCalled();
    });
});
