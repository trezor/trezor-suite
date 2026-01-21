import type { CryptoId } from 'invity-api';

import { extraDependenciesCommonMock } from '@suite-common/test-utils';
import { btcAsset } from '@suite-native/trading-fixtures';
import { TradeableAsset } from '@suite-native/trading-types';

import { TradingState, tradingActions, tradingSlice } from '../../reducers';
import {
    selectIsTradingFavouriteAsset,
    selectTradingFavouriteAssets,
    selectTradingFavouriteAssetsArray,
} from '../favouritesSelectors';

describe('favouritesSelectors', () => {
    let tradingReducer: ReturnType<typeof tradingSlice.prepareReducer>;
    let state: TradingState;

    beforeEach(() => {
        tradingReducer = tradingSlice.prepareReducer(extraDependenciesCommonMock);
        state = tradingReducer(
            undefined,
            tradingActions.addTradeableAssetToFavourites(btcAsset.cryptoId),
        );
    });

    it('selectTradingFavouriteAssets should return favourites assets map', () => {
        const favouritesArray = selectTradingFavouriteAssets({
            wallet: { trading: state },
        });

        expect(favouritesArray).toEqual({ bitcoin: true });
    });

    it('selectTradingFavouriteAssetsArray should return memoized array', () => {
        const favouritesArray = selectTradingFavouriteAssetsArray({
            wallet: { trading: state },
        });

        expect(favouritesArray).toEqual(['bitcoin']);
        expect(selectTradingFavouriteAssetsArray({ wallet: { trading: state } })).toBe(
            favouritesArray,
        );
    });

    it.each([
        [true, 'bitcoin'],
        [false, 'eth'],
        [false, 'eth__0x0000000000000000000000000000000000000000'],
    ] as [boolean, CryptoId][])(
        'selectIsTradingFavouriteAsset should be [%s] for asset with cryptoId [%s] ',
        (expectedValue, cryptoId) => {
            const asset = { cryptoId } as unknown as TradeableAsset;

            expect(selectIsTradingFavouriteAsset({ wallet: { trading: state } }, asset)).toBe(
                expectedValue,
            );
        },
    );
});
