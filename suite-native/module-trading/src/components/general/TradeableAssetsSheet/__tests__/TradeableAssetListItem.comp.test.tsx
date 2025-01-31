import { fireEvent, render } from '@suite-native/test-utils';

import { TradeableAsset } from '../../../../types';
import { TradeableAssetListItem } from '../TradeableAssetListItem';

describe('TradeableAssetListItem', () => {
    const btcAsset: TradeableAsset = { symbol: 'btc' };
    const usdcAsset = {
        symbol: 'eth',
        name: 'USDC',
        contractAddress: 'contractAddress',
    } as TradeableAsset;

    it('should render with correct labels when no name is specified', () => {
        const { getByText } = render(
            <TradeableAssetListItem
                asset={btcAsset}
                onPress={jest.fn()}
                onFavouritePress={jest.fn()}
                priceChange={0.9}
                fiatRate={100}
            />,
        );

        expect(getByText('Bitcoin')).toBeDefined();
        expect(getByText('BTC')).toBeDefined();
        expect(getByText('$100.00')).toBeDefined();
        expect(getByText('90.0%')).toBeDefined();
    });

    it('should render with correct labels when name is specified', () => {
        const { getByText } = render(
            <TradeableAssetListItem
                asset={usdcAsset}
                onPress={jest.fn()}
                onFavouritePress={jest.fn()}
                priceChange={0}
                fiatRate={1}
            />,
        );

        expect(getByText('USDC')).toBeDefined();
        expect(getByText('ETH')).toBeDefined();
    });

    it('should call onPress callback when clicked', () => {
        const onPress = jest.fn();
        const { getByText } = render(
            <TradeableAssetListItem
                asset={btcAsset}
                onPress={onPress}
                onFavouritePress={jest.fn()}
                priceChange={0}
                fiatRate={1}
            />,
        );

        fireEvent.press(getByText('BTC'));

        expect(onPress).toHaveBeenCalledWith();
    });

    it('should call onFavouritePress when star is clicked', () => {
        const onFavouritePress = jest.fn();
        const { getByAccessibilityHint } = render(
            <TradeableAssetListItem
                asset={btcAsset}
                onPress={jest.fn()}
                onFavouritePress={onFavouritePress}
                priceChange={0}
                fiatRate={1}
            />,
        );

        fireEvent.press(getByAccessibilityHint('Add to favourites'));

        expect(onFavouritePress).toHaveBeenCalledWith();
    });
});
