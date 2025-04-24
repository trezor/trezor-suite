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

        expect(getByText('BTC')).toBeTruthy();
    });

    it('should render display ETH as display symbol for L2 EVMs', () => {
        const { getByText } = renderWithBasicProvider(
            <TradeableAssetButton
                asset={ethOnBaseAsset}
                onPress={jest.fn()}
                accessibilityLabel="a11yLabel"
            />,
        );

        expect(getByText('ETH')).toBeTruthy();
    });

    it('should render display token name when token is present', () => {
        const { getByText, getByLabelText } = renderWithBasicProvider(
            <TradeableAssetButton
                asset={usdcAsset}
                onPress={jest.fn()}
                accessibilityLabel="a11yLabel"
            />,
        );

        expect(getByText('USDC')).toBeTruthy();
        expect(getByLabelText('eth0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48')).toBeTruthy();
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

    it('should render ETH icon for ETH on BASE asset', () => {
        const { getByText, getByLabelText } = renderWithBasicProvider(
            <TradeableAssetButton
                asset={ethOnBaseAsset}
                onPress={jest.fn()}
                accessibilityLabel="a11yLabel"
            />,
        );

        expect(getByText('ETH')).toBeTruthy();
        expect(getByLabelText('ETH')).toBeTruthy();
    });
});
