import { fireEvent, renderWithStoreProvider, screen } from '@suite-native/test-utils';
import { adaAsset, btcAsset, usdcAsset } from '@suite-native/trading-fixtures';
import { type TradeableAsset } from '@suite-native/trading-types';

import { TradeableAssetSheet, type TradeableAssetsSheetProps } from '../TradeableAssetSheet';

describe('TradeableAssetSheet', () => {
    const defaultAssets: TradeableAsset[] = [btcAsset, usdcAsset, adaAsset];

    const renderTradeableAssetsSheet = (props: Partial<TradeableAssetsSheetProps>) =>
        renderWithStoreProvider(
            <TradeableAssetSheet
                assets={defaultAssets}
                onAssetSelect={jest.fn}
                onClose={jest.fn}
                isVisible={true}
                onFilterChange={jest.fn}
                onSelectedNetworkFilter={jest.fn}
                flashListKey="test-key"
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

        expect(getByText('Coin not found')).toBeTruthy();
        expect(
            getByText('Check the spelling or browse the list to select an option.'),
        ).toBeTruthy();
    });
});
