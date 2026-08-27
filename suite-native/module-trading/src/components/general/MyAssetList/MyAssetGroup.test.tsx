import type { CryptoId } from 'invity-api';

import { asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { fireEvent, renderWithStoreProvider } from '@suite-native/test-utils-store';
import { type MyAsset } from '@suite-native/trading-types';
import { BigNumber } from '@trezor/utils';

import { MyAssetGroup } from './MyAssetGroup';

const createAsset = (index: number, isEnabled = true): MyAsset => ({
    name: `Token ${index}`,
    symbol: 'eth',
    cryptoId: `ethereum--token-${index}` as CryptoId,
    balance: `${index}`,
    fiatBalance: asBaseCurrencyAmount(new BigNumber(index)),
    isEnabled,
});

describe('MyAssetGroup', () => {
    const assets = [createAsset(1), createAsset(2), createAsset(3)];

    it('shows two preview icons and an overflow count while collapsed', async () => {
        const testID = '@trading/my-asset-group';
        const { getByTestId, getByText } = await renderWithStoreProvider(
            <MyAssetGroup
                assets={assets}
                onAssetSelect={jest.fn()}
                testID={testID}
                title="Low balance"
            />,
        );

        expect(getByText('+1')).toBeOnTheScreen();
        expect(getByTestId(`${testID}/toggle`).props.accessibilityState).toEqual({
            expanded: false,
        });
        expect(getByTestId(`${testID}/content`, { includeHiddenElements: true })).toHaveStyle({
            height: 0,
        });
    });

    it('renders all assets when expanded', async () => {
        const testID = '@trading/my-asset-group';
        const { getByTestId, getByText } = await renderWithStoreProvider(
            <MyAssetGroup
                assets={assets}
                onAssetSelect={jest.fn()}
                testID={testID}
                title="Low balance"
            />,
        );

        await fireEvent.press(getByTestId(`${testID}/toggle`));

        expect(getByTestId(`${testID}/toggle`).props.accessibilityState).toEqual({
            expanded: true,
        });
        expect(getByText('Token 1')).toBeOnTheScreen();
        expect(getByText('Token 2')).toBeOnTheScreen();
        expect(getByText('Token 3')).toBeOnTheScreen();
    });

    it('does not select a non-tradeable asset', async () => {
        const onAssetSelect = jest.fn();
        const { getByText } = await renderWithStoreProvider(
            <MyAssetGroup
                assets={[createAsset(1, false)]}
                onAssetSelect={onAssetSelect}
                testID="@trading/my-asset-group"
                title="Non-tradeable"
            />,
        );

        await fireEvent.press(getByText('Non-tradeable'));
        await fireEvent.press(getByText('Token 1'));

        expect(onAssetSelect).not.toHaveBeenCalled();
    });
});
