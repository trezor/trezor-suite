/* eslint-disable no-console */
import { unique } from '@trezor/utils';

import { coinGeckoApi } from './api';
import {
    AdvancedTokenStructure,
    SimpleTokenStructure,
    TokenStructureType,
} from '../../src/tokenDefinitionsTypes';
import { NFTS_PER_PAGE } from '../constants';
import { type NftData, nftListSchema } from '../schemas';

const fetchNftList = coinGeckoApi('/nfts/list', {
    method: 'GET',
    schema: nftListSchema,
});

const fetchNftPage = (page: number, assetPlatformId: string) =>
    fetchNftList({
        params: {
            page,
            per_page: NFTS_PER_PAGE,
            asset_platform_id: assetPlatformId,
        },
    });

export const fetchNftData = async (assetPlatformId: string, structure: TokenStructureType) => {
    console.log('Start fetching NFT data for:', assetPlatformId, 'platform');

    let page = 1;
    let allData: NftData[] = [];

    while (true) {
        const data = await fetchNftPage(page, assetPlatformId);
        allData = allData.concat(data);
        page++;
        if (data.length < NFTS_PER_PAGE) break;
    }

    console.log('Number of NFT records fetched:', allData.length);

    if (structure === TokenStructureType.ADVANCED) {
        return allData.reduce<AdvancedTokenStructure>((acc, { contract_address, symbol, name }) => {
            acc[contract_address] = { symbol, name };

            return acc;
        }, {});
    }

    return unique(allData.map(item => item.contract_address)) as SimpleTokenStructure;
};
