import { combineReducers } from '@reduxjs/toolkit';

import { extraDependenciesCommonMock } from '@suite-common/test-utils';
import { initialWalletSettingsState } from '@suite-common/wallet-core';
import {
    createLightStore,
    createStaticReducer,
    fireEvent,
    renderWithStoreProvider,
} from '@suite-native/test-utils-store';
import { btcAsset, getWalletState, usdcAsset } from '@suite-native/trading-fixtures';
import { tradingSlice } from '@suite-native/trading-state';

import { createTradingPreloadedState } from '../../../../__tests__/tradingTestUtils';
import {
    TradeableAssetListItem,
    type TradeableAssetListItemProps,
} from '../TradeableAssetListItem';

const reducer = {
    ...Object.fromEntries(
        Object.entries(createTradingPreloadedState()).map(([key, value]) => [
            key,
            createStaticReducer(value),
        ]),
    ),
    wallet: combineReducers({
        settings: createStaticReducer(initialWalletSettingsState),
        accounts: createStaticReducer(getWalletState({ tradeType: 'buy' }).accounts),
        trading: tradingSlice.prepareReducer(extraDependenciesCommonMock),
    }),
};

describe('TradeableAssetListItem', () => {
    const renderComponent = ({
        onPress = jest.fn(),
        asset = btcAsset,
    }: Partial<TradeableAssetListItemProps>) => {
        const store = createLightStore({
            reducer,
            preloadedState: {
                wallet: {
                    trading: getWalletState({ tradeType: 'buy' }).trading,
                },
            },
        });

        return renderWithStoreProvider(<TradeableAssetListItem asset={asset} onPress={onPress} />, {
            store,
        });
    };

    it('should render with correct labels', () => {
        const { getAllByText } = renderComponent({ asset: usdcAsset });

        expect(getAllByText('USDC').length).toBeGreaterThan(0);
        expect(getAllByText('Ethereum').length).toBeGreaterThan(0);
    });

    it('should call onPress callback when clicked', () => {
        const onPress = jest.fn();
        const { getByText } = renderComponent({ asset: btcAsset, onPress });

        fireEvent.press(getByText('BTC'));

        expect(onPress).toHaveBeenCalledWith();
    });

    it('should add asset to favourites on star click', () => {
        const { getByAccessibilityHint } = renderComponent({ asset: btcAsset });

        fireEvent.press(getByAccessibilityHint('Add to favourites'));

        expect(getByAccessibilityHint('Remove from favourites')).toBeTruthy();
    });

    it('should remove asset from favourites on star click', () => {
        const { getByAccessibilityHint } = renderComponent({ asset: btcAsset });

        fireEvent.press(getByAccessibilityHint('Add to favourites'));
        fireEvent.press(getByAccessibilityHint('Remove from favourites'));

        expect(getByAccessibilityHint('Add to favourites')).toBeTruthy();
    });
});
