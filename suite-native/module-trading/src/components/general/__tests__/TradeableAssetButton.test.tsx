import { act, fireEvent, renderWithBasicProvider } from '@suite-native/test-utils';
import { btcAsset, ethOnBaseAsset, usdcAsset } from '@suite-native/trading-fixtures';

import { TradeableAssetButton, type TradeableAssetButtonProps } from '../TradeableAssetButton';

describe('TradeableAssetButton', () => {
    const renderButton = async (initialProps: Partial<TradeableAssetButtonProps>) => {
        const ret = renderWithBasicProvider(
            <TradeableAssetButton
                asset={btcAsset}
                onPress={jest.fn()}
                accessibilityLabel="a11yLabel"
                {...initialProps}
            />,
        );
        await act(() => Promise.resolve());

        return ret;
    };

    it('should render display name of given symbol', async () => {
        const { getByText } = await renderButton({ asset: btcAsset });

        expect(getByText('BTC')).toBeTruthy();
    });

    it('should render display ETH as display symbol for L2 EVMs', async () => {
        const { getByText } = await renderButton({ asset: ethOnBaseAsset });

        expect(getByText('ETH')).toBeTruthy();
    });

    it('should render display token name when token is present', async () => {
        const { getByText, getByLabelText } = await renderButton({ asset: usdcAsset });

        expect(getByText('USDC')).toBeTruthy();
        expect(getByLabelText('eth:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48')).toBeTruthy();
    });

    it('should call onPress callback', async () => {
        const pressSpy = jest.fn();
        const { getByText } = await renderButton({ asset: btcAsset, onPress: pressSpy });

        const button = getByText('BTC');
        fireEvent.press(button);

        expect(pressSpy).toHaveBeenCalledWith();
    });

    it('should render ETH icon for ETH on BASE asset', async () => {
        const { getByText, getByLabelText } = await renderButton({ asset: ethOnBaseAsset });

        expect(getByText('ETH')).toBeTruthy();
        expect(getByLabelText('ETH')).toBeTruthy();
    });
});
