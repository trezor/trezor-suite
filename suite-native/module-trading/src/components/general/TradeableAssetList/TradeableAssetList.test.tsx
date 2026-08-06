import { getTranslation } from '@suite-native/intl';
import { fireEvent, screen } from '@suite-native/test-utils-store';
import { adaAsset, btcAsset, usdcAsset } from '@suite-native/trading-fixtures';
import { type TradeableAsset } from '@suite-native/trading-types';

import { TradeableAssetList, type TradeableAssetListProps } from './TradeableAssetList';
import { renderWithTradingProvider } from '../../../test-utils/tradingTestUtils';

describe('TradeableAssetList', () => {
    const defaultAssets: TradeableAsset[] = [btcAsset, usdcAsset, adaAsset];

    const renderTradeableAssetList = (props: Partial<TradeableAssetListProps>) =>
        renderWithTradingProvider(
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
        );

    afterEach(() => {
        screen.unmount();
    });

    it('selects a pressed asset', () => {
        const onAssetSelect = jest.fn();
        const { getByText } = renderTradeableAssetList({ onAssetSelect });

        fireEvent.press(getByText('BTC'));

        expect(onAssetSelect).toHaveBeenCalledWith(btcAsset);
    });

    it('renders the empty state', () => {
        const { getByText } = renderTradeableAssetList({ assets: [] });

        expect(
            getByText(getTranslation('moduleTrading.tradeableAssetsSheet.emptyTitleText')),
        ).toBeTruthy();
        expect(
            getByText(getTranslation('moduleTrading.tradeableAssetsSheet.emptyDescriptionText')),
        ).toBeTruthy();
    });
});
