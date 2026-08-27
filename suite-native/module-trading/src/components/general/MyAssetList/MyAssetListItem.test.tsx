import type { CryptoId } from 'invity-api';

import { fireEvent, renderWithStoreProvider } from '@suite-native/test-utils-store';
import { type MyAsset } from '@suite-native/trading-types';

import { MyAssetListItem } from './MyAssetListItem';

const asset: MyAsset = {
    balance: '1',
    cryptoId: 'bitcoin' as CryptoId,
    fiatBalance: null,
    isEnabled: true,
    name: 'Bitcoin',
    symbol: 'btc',
};

describe('MyAssetListItem', () => {
    it('renders an accessible asset button and calls onPress', () => {
        const onPress = jest.fn();
        const { getByRole } = renderWithStoreProvider(
            <MyAssetListItem asset={asset} onPress={onPress} />,
        );
        const button = getByRole('button', { name: 'Bitcoin' });

        expect(button.props.accessibilityState).toEqual({ disabled: false });

        fireEvent.press(button);

        expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('does not call onPress when the asset is disabled', () => {
        const onPress = jest.fn();
        const { getByRole } = renderWithStoreProvider(
            <MyAssetListItem asset={{ ...asset, isEnabled: false }} onPress={onPress} />,
        );
        const button = getByRole('button', { name: 'Bitcoin' });

        expect(button.props.accessibilityState).toEqual({ disabled: true });
        expect(button).toHaveStyle({ opacity: 0.5 });

        fireEvent.press(button);

        expect(onPress).not.toHaveBeenCalled();
    });
});
