import type { CryptoId } from 'invity-api';

import { renderHook, waitFor } from '@suite-native/test-utils';
// eslint-disable-next-line local-rules/no-package-deep-imports
import { PreloadedState, StoreProviderForTests } from '@suite-native/test-utils/store';
import { adaAsset, btcAsset, usdcAsset } from '@suite-native/trading-fixtures';
import { TradeableAsset } from '@suite-native/trading-types';

import { useFavouriteAssetsSectionList } from '../useFavouriteAssetsSectionList';

describe('useFavouriteAssetsSectionList', () => {
    const defaultFavouriteAssets = {
        bitcoin: true,
        'ethereum--0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': true,
    };

    const renderHookUseTradingFavouriteAssetsSectionList = async (
        initialAssets: TradeableAsset[],
        favouriteAssets: Record<CryptoId, true>,
    ) => {
        const preloadedState: Partial<PreloadedState> = {
            wallet: {
                trading: {
                    favouriteAssets,
                },
            },
        };

        const ret = renderHook<
            ReturnType<typeof useFavouriteAssetsSectionList>,
            { assets: TradeableAsset[] }
        >(({ assets }) => useFavouriteAssetsSectionList(assets), {
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
                label: 'All assets',
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
                label: 'All assets',
                data: [adaAsset],
                sectionData: { isFavourite: false },
            },
        ]);
    });
});
