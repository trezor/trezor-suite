import { type Network } from '@suite-common/wallet-config';
import { getTranslation } from '@suite-native/intl';
import { fireEvent, renderWithStoreProvider } from '@suite-native/test-utils-store';

import { TradeableAssetFilterTabs } from './TradeableAssetFilterTabs';

jest.mock('@suite-native/discovery', () => {
    const networks: Network[] = [
        {
            name: 'Bitcoin',
            symbol: 'btc',
        } as Network,
        {
            name: 'Ethereum',
            symbol: 'eth',
        } as Network,
    ];

    return {
        ...jest.requireActual('@suite-native/discovery'),
        selectDiscoverySupportedNetworks: () => networks,
    };
});

describe('TradeableAssetFilterTabs', () => {
    const renderComponent = (onSelectedNetworkFilter = jest.fn()) =>
        renderWithStoreProvider(
            <TradeableAssetFilterTabs
                isVisible={true}
                animationDuration={300}
                onSelectedNetworkFilter={onSelectedNetworkFilter}
            />,
        );

    it('should render all filter tabs including "All" option', () => {
        const { getByText } = renderComponent();

        expect(getByText(getTranslation('moduleTrading.providerSheet.filters.all'))).toBeTruthy();
        expect(getByText('Bitcoin')).toBeTruthy();
        expect(getByText('Ethereum')).toBeTruthy();
    });

    it('should not render anything when visible is false', () => {
        const { queryByText } = renderWithStoreProvider(
            <TradeableAssetFilterTabs
                isVisible={false}
                animationDuration={300}
                onSelectedNetworkFilter={jest.fn()}
            />,
        );

        expect(queryByText(getTranslation('moduleTrading.providerSheet.filters.all'))).toBeNull();
        expect(queryByText('Bitcoin')).toBeNull();
        expect(queryByText('Ethereum')).toBeNull();
    });

    it('should call onSelectedNetworkFilter with undefined when "All" is selected', () => {
        const onSelectedNetworkFilter = jest.fn();
        const { getByText } = renderComponent(onSelectedNetworkFilter);

        fireEvent.press(getByText(getTranslation('moduleTrading.providerSheet.filters.all')));

        expect(onSelectedNetworkFilter).toHaveBeenCalledWith(undefined);
    });

    it('should call onSelectedNetworkFilter with network symbol when network tab is selected', () => {
        const onSelectedNetworkFilter = jest.fn();
        const { getByText } = renderComponent(onSelectedNetworkFilter);

        fireEvent.press(getByText('Bitcoin'));

        expect(onSelectedNetworkFilter).toHaveBeenCalledWith('btc');
    });

    it('should call onSelectedNetworkFilter with undefined when hidden', () => {
        const onSelectedNetworkFilter = jest.fn();
        const { rerender } = renderComponent(onSelectedNetworkFilter);

        rerender(
            <TradeableAssetFilterTabs
                isVisible={false}
                animationDuration={300}
                onSelectedNetworkFilter={onSelectedNetworkFilter}
            />,
        );

        expect(onSelectedNetworkFilter).toHaveBeenCalledWith(undefined);
    });
});
