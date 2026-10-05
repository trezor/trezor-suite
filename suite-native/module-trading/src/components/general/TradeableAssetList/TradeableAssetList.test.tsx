import {
    mockNetworkIcon,
    mockNetworkModule,
    mockNetworkModuleRepository,
} from '@suite-common/networks/mocks';
import { getTranslation } from '@suite-native/intl';
import { fireEvent, screen } from '@suite-native/test-utils-store';
import { adaAsset, btcAsset, usdcAsset } from '@suite-native/trading-fixtures';
import { type TradeableAsset } from '@suite-native/trading-types';
import { type NetworkSymbol } from '@trezor/network-module-types';

import { TradeableAssetList, type TradeableAssetListProps } from './TradeableAssetList';
import { renderWithTradingProvider } from '../../../test-utils/tradingTestUtils';

const networkModule = mockNetworkModule();
const networkModuleRepository = mockNetworkModuleRepository({
    get: () => networkModule,
    isSupportedNetwork: (_symbol): _symbol is NetworkSymbol => true,
});

describe('TradeableAssetList', () => {
    const defaultAssets: TradeableAsset[] = [btcAsset, usdcAsset, adaAsset];

    const renderTradeableAssetList = async (props: Partial<TradeableAssetListProps>) =>
        await renderWithTradingProvider(
            <TradeableAssetList
                assets={defaultAssets}
                onAssetSelect={jest.fn()}
                onFilterChange={jest.fn()}
                onSelectedNetworkFilter={jest.fn()}
                selectedNetworkFilter={undefined}
                scrollResetKey="test-key"
                assetBalances={new Map()}
                {...props}
            />,
            { services: { networks: { networkIcon: mockNetworkIcon(), networkModuleRepository } } },
        );

    afterEach(async () => {
        await screen.unmount();
    });

    it('selects a pressed asset', async () => {
        const onAssetSelect = jest.fn();
        const { getByText } = await renderTradeableAssetList({ onAssetSelect });

        await fireEvent.press(getByText('BTC'));

        expect(onAssetSelect).toHaveBeenCalledWith(btcAsset);
    });

    it('renders the empty state', async () => {
        const { getByText } = await renderTradeableAssetList({ assets: [] });

        expect(
            getByText(getTranslation('moduleTrading.tradeableAssetsSheet.emptyTitleText')),
        ).toBeTruthy();
        expect(
            getByText(getTranslation('moduleTrading.tradeableAssetsSheet.emptyDescriptionText')),
        ).toBeTruthy();
    });
});
