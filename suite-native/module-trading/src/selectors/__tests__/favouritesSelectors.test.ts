import { CryptoId } from 'invity-api';

import { extraDependenciesMock } from '@suite-common/test-utils';

import { btcAsset } from '../../__fixtures__/tradeableAssets';
import { TradingState, addTradeableAssetToFavourites, tradingSlice } from '../../tradingSlice';
import { TradeableAsset } from '../../types';
import {
    selectIsTradingFavouriteAsset,
    selectTradingFavouriteAssets,
    selectTradingFavouriteAssetsArray,
} from '../favouritesSelectors';

describe('favouritesSelectors', () => {
    let tradingReducer: ReturnType<typeof tradingSlice.prepareReducer>;
    let state: TradingState;

    beforeEach(() => {
        tradingReducer = tradingSlice.prepareReducer(extraDependenciesMock);
        state = tradingReducer(undefined, addTradeableAssetToFavourites(btcAsset.cryptoId));
    });

    it('selectTradingFavouriteAssets should return favourites assets map', () => {
        const favouritesArray = selectTradingFavouriteAssets({
            wallet: { tradingNew: state },
        });

        expect(favouritesArray).toEqual({ bitcoin: true });
    });

    it('selectTradingFavouriteAssetsArray should return memoized array', () => {
        const favouritesArray = selectTradingFavouriteAssetsArray({
            wallet: { tradingNew: state },
        });

        expect(favouritesArray).toEqual(['bitcoin']);
        expect(selectTradingFavouriteAssetsArray({ wallet: { tradingNew: state } })).toBe(
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

            expect(selectIsTradingFavouriteAsset({ wallet: { tradingNew: state } }, asset)).toBe(
                expectedValue,
            );
        },
    );
});
