import { type NetworkSymbol } from '@suite-common/wallet-config';
import { getTranslation } from '@suite-native/intl';
import { fireEvent, renderWithStoreProvider } from '@suite-native/test-utils-store';

import { MyAssetSheetHeader } from './MyAssetSheetHeader';

jest.mock('@trezor/react-utils', () => ({
    ...jest.requireActual('@trezor/react-utils'),
    useDebounce: () => (fn: () => unknown) => fn(),
}));

describe('MyAssetSheetHeader', () => {
    const renderComponent = ({
        onClose = jest.fn(),
        onFilterChange = jest.fn(),
        onSelectedNetworkFilter = jest.fn(),
        availableNetworks = ['btc', 'eth'] as NetworkSymbol[],
    } = {}) =>
        renderWithStoreProvider(
            <MyAssetSheetHeader
                onClose={onClose}
                onFilterChange={onFilterChange}
                onSelectedNetworkFilter={onSelectedNetworkFilter}
                availableNetworks={availableNetworks}
            />,
        );

    it('should display title and hide filter tabs by default', () => {
        const { getByText, queryByText } = renderComponent();

        expect(getByText(getTranslation('moduleTrading.myAssetSheet.title'))).toBeTruthy();
        expect(queryByText(getTranslation('moduleTrading.providerSheet.filters.all'))).toBeNull();
    });

    it('should show filter tabs after focusing the search input', () => {
        const { getByPlaceholderText, getByText, queryByText } = renderComponent();

        fireEvent(getByPlaceholderText(/Search/), 'focus');

        expect(getByText(getTranslation('moduleTrading.providerSheet.filters.all'))).toBeTruthy();
        expect(queryByText(getTranslation('moduleTrading.myAssetSheet.title'))).toBeNull();
    });

    it('should display cancel button after focusing the search input', () => {
        const { getByPlaceholderText, getByText } = renderComponent();

        fireEvent(getByPlaceholderText(/Search/), 'focus');

        expect(getByText(getTranslation('generic.buttons.cancel'))).toBeTruthy();
    });

    it('should not display cancel button by default', () => {
        const { queryByText } = renderComponent();

        expect(queryByText(getTranslation('generic.buttons.cancel'))).toBeNull();
    });

    it('should call onClose when close button is pressed', () => {
        const onClose = jest.fn();
        const { getByLabelText } = renderComponent({ onClose });

        fireEvent.press(getByLabelText(getTranslation('generic.buttons.close')));

        expect(onClose).toHaveBeenCalled();
    });

    it('should call onFilterChange when search text changes', () => {
        const onFilterChange = jest.fn();
        const { getByPlaceholderText } = renderComponent({ onFilterChange });

        fireEvent.changeText(getByPlaceholderText(/Search/), 'Bitcoin');

        expect(onFilterChange).toHaveBeenCalledWith('Bitcoin');
    });

    it('should call onSelectedNetworkFilter when a network tab is selected', () => {
        const onSelectedNetworkFilter = jest.fn();
        const { getByPlaceholderText, getByText } = renderComponent({ onSelectedNetworkFilter });

        fireEvent(getByPlaceholderText(/Search/), 'focus');
        fireEvent.press(getByText('Bitcoin'));

        expect(onSelectedNetworkFilter).toHaveBeenCalledWith('btc');
    });
});
