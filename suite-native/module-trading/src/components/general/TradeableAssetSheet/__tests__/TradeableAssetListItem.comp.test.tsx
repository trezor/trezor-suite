import { fireEvent, renderWithStoreProviderAsync } from '@suite-native/test-utils';

import { btcAsset, usdcAsset } from '../../../../__fixtures__/tradeableAssets';
import { TradeableAssetListItem, TradeableAssetListItemProps } from '../TradeableAssetListItem';

describe('TradeableAssetListItem', () => {
    const renderComponent = ({
        onPress = jest.fn(),
        asset = btcAsset,
    }: Partial<TradeableAssetListItemProps>) =>
        renderWithStoreProviderAsync(<TradeableAssetListItem asset={asset} onPress={onPress} />);

    it('should render with correct labels', async () => {
        const { getByLabelText } = await renderComponent({ asset: usdcAsset });

        expect(getByLabelText('Coin name')).toHaveTextContent('USDC');
        expect(getByLabelText('Coin symbol')).toHaveTextContent('USDC');
        expect(getByLabelText('Network name')).toHaveTextContent('Ethereum');
    });

    it('should call onPress callback when clicked', async () => {
        const onPress = jest.fn();
        const { getByText } = await renderComponent({ asset: btcAsset, onPress });

        fireEvent.press(getByText('BTC'));

        expect(onPress).toHaveBeenCalledWith();
    });

    it('should add asset to favourites on star click', async () => {
        const { getByAccessibilityHint } = await renderComponent({ asset: btcAsset });

        fireEvent.press(getByAccessibilityHint('Add to favourites'));

        expect(getByAccessibilityHint('Remove from favourites')).toBeTruthy();
    });

    it('should remove asset from favourites on star click', async () => {
        const { getByAccessibilityHint } = await renderComponent({ asset: btcAsset });

        fireEvent.press(getByAccessibilityHint('Add to favourites'));
        fireEvent.press(getByAccessibilityHint('Remove from favourites'));

        expect(getByAccessibilityHint('Add to favourites')).toBeTruthy();
    });
});
