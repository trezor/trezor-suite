import {
    mockNetworkIcon,
    mockNetworkModule,
    mockNetworkModuleRepository,
} from '@suite-common/networks/mocks';
import { fireEvent } from '@suite-native/test-utils-store';
import { type NetworkSymbol } from '@trezor/network-module-types';

import { TradingAssetListHeader } from './TradingAssetListHeader';
import { renderWithTradingProvider } from '../../test-utils/tradingTestUtils';

const networkModule = mockNetworkModule();
const networkModuleRepository = mockNetworkModuleRepository({
    get: () => networkModule,
    isSupportedNetwork: (_symbol): _symbol is NetworkSymbol => true,
});

jest.mock('@suite-native/discovery', () => ({
    ...jest.requireActual('@suite-native/discovery'),
    selectDeviceEnabledDiscoveryNetworkSymbols: () => ['eth'],
}));

describe('TradingAssetListHeader', () => {
    const testID = '@trading/test/asset-list';

    it('forwards search and network changes', async () => {
        const onFilterChange = jest.fn();
        const onSelectedNetworkFilter = jest.fn();
        const { getByTestId } = await renderWithTradingProvider(
            <TradingAssetListHeader
                networkFilterMode="discovered"
                onFilterChange={onFilterChange}
                onSelectedNetworkFilter={onSelectedNetworkFilter}
                placeholder="Search assets"
                selectedNetworkFilter={undefined}
                testID={testID}
            />,
            { services: { networks: { networkIcon: mockNetworkIcon(), networkModuleRepository } } },
        );

        await fireEvent.changeText(getByTestId(`${testID}/search-input`), 'ether');
        await fireEvent.press(getByTestId(`${testID}/network-picker`));
        await fireEvent.press(getByTestId(`${testID}/network-picker/networks-sheet/eth`));

        expect(onFilterChange).toHaveBeenCalledWith('ether');
        expect(onSelectedNetworkFilter).toHaveBeenCalledWith('eth');
    });
});
