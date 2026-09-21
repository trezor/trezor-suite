import { getTranslation } from '@suite-native/intl';
import { act, fireEvent, renderWithBasicProvider } from '@suite-native/test-utils';
import { adaAsset, btcAsset, ethOnBaseAsset, usdcAsset } from '@suite-native/trading-fixtures';

import { TradeableAssetButton, type TradeableAssetButtonProps } from './TradeableAssetButton';

describe('TradeableAssetButton', () => {
    const renderButton = async (initialProps: Partial<TradeableAssetButtonProps> = {}) => {
        const res = await renderWithBasicProvider(
            <TradeableAssetButton
                onPress={jest.fn()}
                selectedAsset={undefined}
                {...initialProps}
            />,
        );
        await act(() => Promise.resolve());

        return res;
    };

    it('should render "Select asset" when no network is selected', async () => {
        const { getByLabelText } = await renderButton({ selectedAsset: undefined });

        const button = getByLabelText(getTranslation('moduleTrading.selectCoin.buttonTitle'));

        expect(button).toHaveTextContent(
            new RegExp(`^${getTranslation('moduleTrading.selectCoin.buttonTitle')}.$`),
        );
    });

    it('should render selected asset when network is selected', async () => {
        const { getByLabelText } = await renderButton({ selectedAsset: adaAsset, caret: true });
        const button = getByLabelText(getTranslation('moduleTrading.selectCoin.buttonTitle'));
        expect(button).toHaveTextContent(/^ADA.$/);
    });

    it('should not display caret when caret prop is falsy', async () => {
        const { getByLabelText } = await renderButton({ selectedAsset: adaAsset, caret: false });
        const button = getByLabelText(getTranslation('moduleTrading.selectCoin.buttonTitle'));
        expect(button).toHaveTextContent('ADA');
    });

    it('should render display name of given symbol', async () => {
        const { getByText } = await renderButton({ selectedAsset: btcAsset });

        expect(getByText('BTC')).toBeTruthy();
    });

    it('should render display ETH as display symbol for L2 EVMs', async () => {
        const { getByText } = await renderButton({ selectedAsset: ethOnBaseAsset });

        expect(getByText('ETH')).toBeTruthy();
    });

    it('should render display token name when token is present', async () => {
        const { getByText, getByLabelText } = await renderButton({ selectedAsset: usdcAsset });

        expect(getByText('USDC')).toBeTruthy();
        expect(getByLabelText('eth:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48')).toBeTruthy();
    });

    it('should call onPress callback', async () => {
        const pressSpy = jest.fn();
        const { getByText } = await renderButton({ selectedAsset: btcAsset, onPress: pressSpy });

        const button = getByText('BTC');
        await fireEvent.press(button);

        expect(pressSpy).toHaveBeenCalledTimes(1);
    });

    it('should render ETH icon for ETH on BASE asset', async () => {
        const { getByText, getByLabelText, getByHintText } = await renderButton({
            selectedAsset: ethOnBaseAsset,
        });

        expect(getByText('ETH')).toBeTruthy();
        expect(getByLabelText('ETH')).toBeTruthy();
        expect(getByHintText('Network Icon')).toBeTruthy();
    });
});
