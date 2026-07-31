import { combineReducers } from '@reduxjs/toolkit';

import { extraDependenciesCommonMock } from '@suite-common/test-utils';
import { initialWalletSettingsState } from '@suite-common/wallet-core';
import { getTranslation } from '@suite-native/intl';
import {
    createLightStore,
    createStaticReducer,
    fireEvent,
    renderWithStoreProvider,
} from '@suite-native/test-utils-store';
import { btcAsset, getWalletState, usdcAsset } from '@suite-native/trading-fixtures';
import { tradingSlice } from '@suite-native/trading-state';
import { typedObjectTransformValues } from '@trezor/utils';

import { TradeableAssetListItem, type TradeableAssetListItemProps } from './TradeableAssetListItem';
import { createTradingPreloadedState } from '../../../test-utils/tradingTestUtils';

const reducer = {
    ...typedObjectTransformValues(createTradingPreloadedState(), createStaticReducer),
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

        fireEvent.press(
            getByAccessibilityHint(
                getTranslation('moduleTrading.tradeableAssetsSheet.favouritesAdd'),
            ),
        );

        expect(
            getByAccessibilityHint(
                getTranslation('moduleTrading.tradeableAssetsSheet.favouritesRemove'),
            ),
        ).toBeTruthy();
    });

    it('should remove asset from favourites on star click', () => {
        const { getByAccessibilityHint } = renderComponent({ asset: btcAsset });

        fireEvent.press(
            getByAccessibilityHint(
                getTranslation('moduleTrading.tradeableAssetsSheet.favouritesAdd'),
            ),
        );
        fireEvent.press(
            getByAccessibilityHint(
                getTranslation('moduleTrading.tradeableAssetsSheet.favouritesRemove'),
            ),
        );

        expect(
            getByAccessibilityHint(
                getTranslation('moduleTrading.tradeableAssetsSheet.favouritesAdd'),
            ),
        ).toBeTruthy();
    });
});
