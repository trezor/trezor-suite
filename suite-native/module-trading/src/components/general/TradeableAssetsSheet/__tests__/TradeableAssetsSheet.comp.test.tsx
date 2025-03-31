import { fireEvent, renderWithStoreProviderAsync } from '@suite-native/test-utils';

import { adaAsset, btcAsset, usdcAsset } from '../../../../__fixtures__/tradeableAssets';
import { TradeableAsset } from '../../../../types';
import { TradeableAssetsSheet, TradeableAssetsSheetProps } from '../TradeableAssetsSheet';

describe('TradeableAssetsSheet', () => {
    const defaultAssets: TradeableAsset[] = [btcAsset, usdcAsset, adaAsset];

    const renderTradeableAssetsSheet = (props: Partial<TradeableAssetsSheetProps>) =>
        renderWithStoreProviderAsync(
            <TradeableAssetsSheet
                assets={defaultAssets}
                onAssetSelect={jest.fn}
                onClose={jest.fn}
                isVisible={true}
                onFilterChange={jest.fn}
                onSelectedNetworkFilter={jest.fn}
                {...props}
            />,
        );

    it('should call both onAssetSelect and onClose when an item is pressed', async () => {
        const closeMock = jest.fn();
        const selectMock = jest.fn();

        const { getByText } = await renderTradeableAssetsSheet({
            onClose: closeMock,
            onAssetSelect: selectMock,
        });

        fireEvent.press(getByText('BTC'));

        expect(selectMock).toHaveBeenCalledTimes(1);
        expect(closeMock).toHaveBeenCalledTimes(1);
    });

    it('should render correct empty component', async () => {
        const { getByText } = await renderTradeableAssetsSheet({
            assets: [],
        });

        expect(getByText('No coin found')).toBeTruthy();
    });
});
