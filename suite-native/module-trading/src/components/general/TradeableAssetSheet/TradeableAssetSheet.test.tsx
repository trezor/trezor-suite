import { getTranslation } from '@suite-native/intl';
import { fireEvent, screen } from '@suite-native/test-utils-store';
import { adaAsset, btcAsset, usdcAsset } from '@suite-native/trading-fixtures';
import { type TradeableAsset } from '@suite-native/trading-types';

import { TradeableAssetSheet, type TradeableAssetsSheetProps } from './TradeableAssetSheet';
import { renderWithTradingProvider } from '../../../test-utils/tradingTestUtils';

describe('TradeableAssetSheet', () => {
    const defaultAssets: TradeableAsset[] = [btcAsset, usdcAsset, adaAsset];

    const renderTradeableAssetsSheet = (props: Partial<TradeableAssetsSheetProps>) =>
        renderWithTradingProvider(
            <TradeableAssetSheet
                assets={defaultAssets}
                onAssetSelect={jest.fn}
                onClose={jest.fn}
                isVisible={true}
                onFilterChange={jest.fn}
                onSelectedNetworkFilter={jest.fn}
                scrollResetKey="test-key"
                {...props}
            />,
        );

    afterEach(() => {
        screen.unmount();
    });

    it('should call onAssetSelect and onClose when an item is pressed', () => {
        const closeMock = jest.fn();
        const selectMock = jest.fn();

        const { getByText } = renderTradeableAssetsSheet({
            onClose: closeMock,
            onAssetSelect: selectMock,
        });

        fireEvent.press(getByText('BTC'));

        expect(selectMock).toHaveBeenCalledTimes(1);
        expect(closeMock).toHaveBeenCalledTimes(1);
        expect(closeMock).toHaveBeenCalledWith(undefined);
    });

    it('should call onAssetSelect with hideKeyboardOnAssetSelect=true when an item is pressed', () => {
        const closeMock = jest.fn();
        const selectMock = jest.fn();

        const { getByText } = renderTradeableAssetsSheet({
            onClose: closeMock,
            onAssetSelect: selectMock,
            hideKeyboardOnAssetSelect: true,
        });

        fireEvent.press(getByText('BTC'));

        expect(selectMock).toHaveBeenCalledTimes(1);
        expect(closeMock).toHaveBeenCalledTimes(1);
        expect(closeMock).toHaveBeenCalledWith(true);
    });

    it('should render correct empty component', () => {
        const { getByText } = renderTradeableAssetsSheet({
            assets: [],
        });

        expect(
            getByText(getTranslation('moduleTrading.tradeableAssetsSheet.emptyTitle')),
        ).toBeTruthy();
        expect(
            getByText(getTranslation('moduleTrading.fiatCurrencySheet.emptyDescription')),
        ).toBeTruthy();
    });
});
