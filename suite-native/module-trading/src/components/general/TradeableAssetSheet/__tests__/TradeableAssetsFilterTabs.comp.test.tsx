import { Network } from '@suite-common/wallet-config';
import { fireEvent, renderWithStoreProviderAsync } from '@suite-native/test-utils';

import { TradeableAssetsFilterTabs } from '../TradeableAssetFilterTabs';

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

describe('TradeableAssetsFilterTabs', () => {
    const renderComponent = (onSelectedNetworkFilter = jest.fn()) =>
        renderWithStoreProviderAsync(
            <TradeableAssetsFilterTabs
                visible={true}
                animationDuration={300}
                onSelectedNetworkFilter={onSelectedNetworkFilter}
            />,
        );

    it('should render all filter tabs including "All" option', async () => {
        const { getByText } = await renderComponent();

        expect(getByText('All')).toBeTruthy();
        expect(getByText('Bitcoin')).toBeTruthy();
        expect(getByText('Ethereum')).toBeTruthy();
    });

    it('should not render anything when visible is false', async () => {
        const { queryByText } = await renderWithStoreProviderAsync(
            <TradeableAssetsFilterTabs
                visible={false}
                animationDuration={300}
                onSelectedNetworkFilter={jest.fn()}
            />,
        );

        expect(queryByText('All')).toBeNull();
        expect(queryByText('Bitcoin')).toBeNull();
        expect(queryByText('Ethereum')).toBeNull();
    });

    it('should call onSelectedNetworkFilter with undefined when "All" is selected', async () => {
        const onSelectedNetworkFilter = jest.fn();
        const { getByText } = await renderComponent(onSelectedNetworkFilter);

        fireEvent.press(getByText('All'));

        expect(onSelectedNetworkFilter).toHaveBeenCalledWith(undefined);
    });

    it('should call onSelectedNetworkFilter with network symbol when network tab is selected', async () => {
        const onSelectedNetworkFilter = jest.fn();
        const { getByText } = await renderComponent(onSelectedNetworkFilter);

        fireEvent.press(getByText('Bitcoin'));

        expect(onSelectedNetworkFilter).toHaveBeenCalledWith('btc');
    });
});
