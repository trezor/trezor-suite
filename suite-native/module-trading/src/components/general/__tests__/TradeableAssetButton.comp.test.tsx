import { fireEvent, render } from '@suite-native/test-utils';

import { TradeableAsset } from '../../../types';
import { TradeableAssetButton } from '../TradeableAssetButton';

describe('TradeableAssetButton', () => {
    const btcAsset: TradeableAsset = { symbol: 'btc' };

    it('should render display name of given symbol', () => {
        const { getByText } = render(
            <TradeableAssetButton
                asset={btcAsset}
                onPress={jest.fn()}
                accessibilityLabel="a11yLabel"
            />,
        );

        expect(getByText('BTC')).toBeDefined();
    });

    it('should call onPress callback', () => {
        const pressSpy = jest.fn();
        const { getByText } = render(
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
