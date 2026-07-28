import { type Network } from '@suite-common/wallet-config';
import { getTranslation } from '@suite-native/intl';
import { fireEvent, renderWithStoreProvider } from '@suite-native/test-utils-store';

import { TradeableAssetSheetHeader } from './TradeableAssetSheetHeader';

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
        );

    it('should display "Coins" and do not display tabs by default', () => {
        const { getByText, queryByText } = renderComponent();

        expect(getByText(getTranslation('moduleTrading.tradeableAssetsSheet.title'))).toBeTruthy();
        expect(queryByText(getTranslation('moduleTrading.providerSheet.filters.all'))).toBeNull();
    });

    it('should display tabs after focusing search input', () => {
        const { getByPlaceholderText, getByText, queryByText } = renderComponent();

        fireEvent(
            getByPlaceholderText(new RegExp(getTranslation('moduleTrading.defaultSearchLabel'))),
            'focus',
        );

        expect(getByText(getTranslation('moduleTrading.providerSheet.filters.all'))).toBeTruthy();
        expect(queryByText(getTranslation('moduleTrading.tradeableAssetsSheet.title'))).toBeNull();
    });

    it('should not display cancel button by default', () => {
        const { queryByText } = renderComponent();

        expect(queryByText(getTranslation('generic.buttons.cancel'))).toBeNull();
    });

    it('should display cancel button after focusing search input', () => {
        const { getByPlaceholderText, getByText } = renderComponent();

        fireEvent(
            getByPlaceholderText(new RegExp(getTranslation('moduleTrading.defaultSearchLabel'))),
            'focus',
        );

        expect(getByText(getTranslation('generic.buttons.cancel'))).toBeTruthy();
    });

    it('should call onClose when close button is pressed ', () => {
        const onClose = jest.fn();
        const { getByLabelText } = renderComponent(onClose);

        fireEvent.press(getByLabelText(getTranslation('generic.buttons.close')));

        expect(onClose).toHaveBeenCalled();
    });
});
