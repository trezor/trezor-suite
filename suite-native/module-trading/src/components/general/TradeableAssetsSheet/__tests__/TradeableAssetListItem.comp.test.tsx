import { fireEvent, renderWithStore } from '@suite-native/test-utils';

import { TradeableAsset } from '../../../../types';
import { TradeableAssetListItem, TradeableAssetListItemProps } from '../TradeableAssetListItem';

describe('TradeableAssetListItem', () => {
    const btcAsset: TradeableAsset = { symbol: 'btc' };
    const usdcAsset = {
        symbol: 'eth',
        name: 'USDC',
        contractAddress: 'contractAddress',
    } as TradeableAsset;

    const renderComponent = async ({
        onPress = jest.fn(),
        priceChange = 0,
        fiatRate = 1,
        asset = btcAsset,
    }: Partial<TradeableAssetListItemProps>) => {
        const result = renderWithStore(
            <TradeableAssetListItem
                asset={asset}
                onPress={onPress}
                priceChange={priceChange}
                fiatRate={fiatRate}
            />,
        );

        await result.findByAccessibilityHint('Add to favourites');

        return result;
    };

    it('should render with correct labels when no name is specified', async () => {
        const { getByText } = await renderComponent({
            asset: btcAsset,
            priceChange: 0.9,
            fiatRate: 100,
        });

        expect(getByText('Bitcoin')).toBeDefined();
        expect(getByText('BTC')).toBeDefined();
        expect(getByText('$100.00')).toBeDefined();
        expect(getByText('90.0%')).toBeDefined();
    });

    it('should render with correct labels when name is specified', async () => {
        const { getByText } = await renderComponent({ asset: usdcAsset });

        expect(getByText('USDC')).toBeDefined();
        expect(getByText('ETH')).toBeDefined();
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

        expect(getByAccessibilityHint('Remove from favourites')).toBeDefined();
    });

    it('should remove asset from favourites on star click', async () => {
        const { getByAccessibilityHint } = await renderComponent({ asset: btcAsset });

        fireEvent.press(getByAccessibilityHint('Add to favourites'));
        fireEvent.press(getByAccessibilityHint('Remove from favourites'));

        expect(getByAccessibilityHint('Add to favourites')).toBeDefined();
    });
});
