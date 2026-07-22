import { type NetworkSymbol } from '@suite-common/wallet-config';
import { getTranslation } from '@suite-native/intl';
import { fireEvent, renderWithStoreProvider } from '@suite-native/test-utils-store';

import { MyAssetFilterTabs } from '../MyAssetFilterTabs';

const availableNetworks: NetworkSymbol[] = ['btc', 'eth'];

describe('MyAssetFilterTabs', () => {
    const renderComponent = (onSelectedNetworkFilter = jest.fn()) =>
        renderWithStoreProvider(
            <MyAssetFilterTabs
                isVisible={true}
                animationDuration={300}
                onSelectedNetworkFilter={onSelectedNetworkFilter}
                availableNetworks={availableNetworks}
            />,
        );

    it('should render "All" tab and one tab per available network', () => {
        const { getByText } = renderComponent();

        expect(getByText(getTranslation('moduleTrading.providerSheet.filters.all'))).toBeTruthy();
        expect(getByText('Bitcoin')).toBeTruthy();
        expect(getByText('Ethereum')).toBeTruthy();
    });

    it('should not render anything when visible is false', () => {
        const { queryByText } = renderWithStoreProvider(
            <MyAssetFilterTabs
                isVisible={false}
                animationDuration={300}
                onSelectedNetworkFilter={jest.fn()}
                availableNetworks={availableNetworks}
            />,
        );

        expect(queryByText(getTranslation('moduleTrading.providerSheet.filters.all'))).toBeNull();
        expect(queryByText('Bitcoin')).toBeNull();
        expect(queryByText('Ethereum')).toBeNull();
    });

    it('should call onSelectedNetworkFilter with undefined when "All" tab is pressed', () => {
        const onSelectedNetworkFilter = jest.fn();
        const { getByText } = renderComponent(onSelectedNetworkFilter);

        fireEvent.press(getByText(getTranslation('moduleTrading.providerSheet.filters.all')));

        expect(onSelectedNetworkFilter).toHaveBeenCalledWith(undefined);
    });

    it('should call onSelectedNetworkFilter with network symbol when a network tab is pressed', () => {
        const onSelectedNetworkFilter = jest.fn();
        const { getByText } = renderComponent(onSelectedNetworkFilter);

        fireEvent.press(getByText('Bitcoin'));

        expect(onSelectedNetworkFilter).toHaveBeenCalledWith('btc');
    });

    it('should call onSelectedNetworkFilter with undefined when unmounted', () => {
        const onSelectedNetworkFilter = jest.fn();
        const { unmount } = renderComponent(onSelectedNetworkFilter);

        unmount();

        expect(onSelectedNetworkFilter).toHaveBeenCalledWith(undefined);
    });

    it('should call onSelectedNetworkFilter with undefined when hidden', () => {
        const onSelectedNetworkFilter = jest.fn();
        const { rerender } = renderComponent(onSelectedNetworkFilter);

        rerender(
            <MyAssetFilterTabs
                isVisible={false}
                animationDuration={300}
                onSelectedNetworkFilter={onSelectedNetworkFilter}
                availableNetworks={availableNetworks}
            />,
        );

        expect(onSelectedNetworkFilter).toHaveBeenCalledWith(undefined);
    });
});
