import { fireEvent } from '@suite-native/test-utils-store';

import { TradingAssetListHeader } from './TradingAssetListHeader';
import { renderWithTradingProvider } from '../../test-utils/tradingTestUtils';

jest.mock('@suite-native/discovery', () => ({
    ...jest.requireActual('@suite-native/discovery'),
    selectDeviceEnabledDiscoveryNetworkSymbols: () => ['eth'],
}));

describe('TradingAssetListHeader', () => {
    const testID = '@trading/test/asset-list';

    it('forwards search and network changes', () => {
        const onFilterChange = jest.fn();
        const onSelectedNetworkFilter = jest.fn();
        const { getByTestId } = renderWithTradingProvider(
            <TradingAssetListHeader
                networkFilterMode="discovered"
                onFilterChange={onFilterChange}
                onSelectedNetworkFilter={onSelectedNetworkFilter}
                placeholder="Search assets"
                selectedNetworkFilter={undefined}
                testID={testID}
            />,
        );

        fireEvent.changeText(getByTestId(`${testID}/search-input`), 'ether');
        fireEvent.press(getByTestId(`${testID}/network-picker`));
        fireEvent.press(getByTestId(`${testID}/network-picker/networks-sheet/eth`));

        expect(onFilterChange).toHaveBeenCalledWith('ether');
        expect(onSelectedNetworkFilter).toHaveBeenCalledWith('eth');
    });
});
