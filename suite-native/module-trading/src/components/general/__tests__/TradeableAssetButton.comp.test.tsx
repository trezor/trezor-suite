import { fireEvent, renderWithBasicProvider } from '@suite-native/test-utils';

import { btcAsset, ethOnBaseAsset, usdcAsset } from '../../../__fixtures__/tradeableAssets';
import { TradeableAssetButton } from '../TradeableAssetButton';

describe('TradeableAssetButton', () => {
    it('should render display name of given symbol', () => {
        const { getByText } = renderWithBasicProvider(
            <TradeableAssetButton
                asset={btcAsset}
                onPress={jest.fn()}
                accessibilityLabel="a11yLabel"
            />,
        );

        expect(getByText('BTC')).toBeDefined();
    });

    it('should render display ETH as display symbol for L2 EVMs', () => {
        const { getByText } = renderWithBasicProvider(
            <TradeableAssetButton
                asset={ethOnBaseAsset}
                onPress={jest.fn()}
                accessibilityLabel="a11yLabel"
            />,
        );

        expect(getByText('ETH')).toBeDefined();
    });

    it('should render display token name when token is present', () => {
        const { getByText } = renderWithBasicProvider(
            <TradeableAssetButton
                asset={usdcAsset}
                onPress={jest.fn()}
                accessibilityLabel="a11yLabel"
            />,
        );

        expect(getByText('USDC')).toBeDefined();
    });

    it('should call onPress callback', () => {
        const pressSpy = jest.fn();
        const { getByText } = renderWithBasicProvider(
            <TradeableAssetButton
                asset={btcAsset}
                onPress={pressSpy}
                accessibilityLabel="a11yLabel"
            />,
        );

        const button = getByText('BTC');
        fireEvent.press(button);

        expect(pressSpy).toHaveBeenCalledWith();
    });
});
