import { CryptoId } from 'invity-api';

import {
    PreloadedState,
    StoreProviderForTests,
    renderHook,
    waitFor,
} from '@suite-native/test-utils';

import { adaAsset, btcAsset, usdcAsset } from '../../__fixtures__/tradeableAssets';
import { TradeableAsset } from '../../types';
import { useTradingFavouriteAssetsSectionList } from '../useTradingFavouriteAssetsSectionList';

describe('useTradingFavouriteAssetsSectionList', () => {
    const defaultFavouriteAssets = {
        bitcoin: btcAsset,
        'ethereum--0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': usdcAsset,
    };

    const renderHookUseTradingFavouriteAssetsSectionList = async (
        initialAssets: TradeableAsset[],
        favouriteAssets: Record<CryptoId, TradeableAsset>,
    ) => {
        const preloadedState: Partial<PreloadedState> = {
            wallet: {
                tradingNew: {
                    favouriteAssets,
                },
            },
        };

        const ret = renderHook(({ assets }) => useTradingFavouriteAssetsSectionList(assets), {
            wrapper: ({ children }) => (
                <StoreProviderForTests preloadedState={preloadedState}>
                    {children}
                </StoreProviderForTests>
            ),
            initialProps: { assets: initialAssets },
        });

        await waitFor(() => {
            expect(ret.result.current).toBeTruthy();
        });

        return ret;
    };

    it('should return empty array when no assets are specified', async () => {
        const { result } = await renderHookUseTradingFavouriteAssetsSectionList(
            [],
            defaultFavouriteAssets,
        );

        expect(result.current).toEqual([]);
    });

    it('should return single section when no favourites are specified', async () => {
        const { result } = await renderHookUseTradingFavouriteAssetsSectionList(
            [btcAsset, usdcAsset, adaAsset],
            {},
        );

        expect(result.current).toEqual([
            {
                key: 'section_all',
                label: 'All coins',
                data: [btcAsset, usdcAsset, adaAsset],
                sectionData: { isFavourite: false },
            },
        ]);
    });

    it('should return single section when all assets are favourites', async () => {
        const { result } = await renderHookUseTradingFavouriteAssetsSectionList(
            [btcAsset, usdcAsset],
            defaultFavouriteAssets,
        );

        expect(result.current).toEqual([
            {
                key: 'section_favourites',
                label: 'Favourites',
                data: [btcAsset, usdcAsset],
                sectionData: { isFavourite: true },
            },
        ]);
    });

    it('should return both sections otherwise', async () => {
        const { result } = await renderHookUseTradingFavouriteAssetsSectionList(
            [btcAsset, usdcAsset, adaAsset],
            defaultFavouriteAssets,
        );

        expect(result.current).toEqual([
            {
                key: 'section_favourites',
                label: 'Favourites',
                data: [btcAsset, usdcAsset],
                sectionData: { isFavourite: true },
            },
            {
                key: 'section_all',
                label: 'All coins',
                data: [adaAsset],
                sectionData: { isFavourite: false },
            },
        ]);
    });
});
