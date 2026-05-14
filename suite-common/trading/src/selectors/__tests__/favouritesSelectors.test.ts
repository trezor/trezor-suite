import type { CryptoId } from 'invity-api';

import { extraDependenciesCommonMock } from '@suite-common/test-utils';

import type { TradingState } from '../../reducers/tradingCommonReducer';
import { tradingActions } from '../../reducers/tradingCommonReducer';
import { prepareTradingReducer } from '../../reducers/tradingReducer';
import {
    selectIsTradingFavouriteAssetByCryptoId,
    selectTradingFavouriteAssets,
    selectTradingFavouriteAssetsArray,
} from '../favouritesSelectors';

const tradingReducer = prepareTradingReducer(extraDependenciesCommonMock);

describe('favouritesSelectors', () => {
    let state: TradingState;

    beforeEach(() => {
        state = tradingReducer(
            undefined,
            tradingActions.addTradeableAssetToFavourites('bitcoin' as CryptoId),
        );
    });

    it('selectTradingFavouriteAssets should return favourites assets map', () => {
        const favourites = selectTradingFavouriteAssets({
            wallet: { trading: state },
        });

        expect(favourites).toEqual({ bitcoin: true });
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
        'selectIsTradingFavouriteAssetByCryptoId should be [%s] for asset with cryptoId [%s]',
        (expectedValue, cryptoId) => {
            expect(
                selectIsTradingFavouriteAssetByCryptoId({ wallet: { trading: state } }, cryptoId),
            ).toBe(expectedValue);
        },
    );
});
