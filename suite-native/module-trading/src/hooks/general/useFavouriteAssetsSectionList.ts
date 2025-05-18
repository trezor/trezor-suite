import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { CryptoId } from 'invity-api';

import { useTranslate } from '@suite-native/intl';

import { SectionListData } from './useSectionList';
import { selectTradingFavouriteAssets } from '../../selectors/favouritesSelectors';
import { TradeableAsset } from '../../types';

export type ListItemExtraData = {
    isFavourite: boolean;
};

type SectionData = {
    favouriteData: TradeableAsset[];
    allData: TradeableAsset[];
};

const getInitialSectionData = (): SectionData => ({
    favouriteData: [],
    allData: [],
});

const getFavouriteSectionDataReducer =
    (favourites: Record<CryptoId, true>) => (sectionData: SectionData, coin: TradeableAsset) => {
        if (favourites[coin.cryptoId]) {
            sectionData.favouriteData.push(coin);
        } else {
            sectionData.allData.push(coin);
        }

        return sectionData;
    };

const filterOutSectionsWithEmptyData = <T, S>({ data }: SectionListData<T, S>[number]) =>
    data.length > 0;

export const useFavouriteAssetsSectionList = (
    assets: TradeableAsset[],
): SectionListData<TradeableAsset, ListItemExtraData> => {
    const favourites = useSelector(selectTradingFavouriteAssets);
    const { translate } = useTranslate();

    return useMemo(() => {
        const { favouriteData, allData } = assets.reduce(
            getFavouriteSectionDataReducer(favourites),
            getInitialSectionData(),
        );

        return [
            {
                key: 'section_favourites',
                label: translate('moduleTrading.tradeableAssetsSheet.favouritesTitle'),
                data: favouriteData,
                sectionData: { isFavourite: true },
            },
            {
                key: 'section_all',
                label: translate('moduleTrading.tradeableAssetsSheet.allTitle'),
                data: allData,
                sectionData: { isFavourite: false },
            },
        ].filter(filterOutSectionsWithEmptyData);
    }, [assets, favourites, translate]);
};
