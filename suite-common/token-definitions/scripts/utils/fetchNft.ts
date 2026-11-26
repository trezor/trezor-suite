/* eslint-disable no-console */
import { unique } from '@trezor/utils';

import { coinGeckoApi, getCoinGeckoHeaders } from './api';
import {
    AdvancedTokenStructure,
    SimpleTokenStructure,
    TokenStructureType,
} from '../../src/tokenDefinitionsTypes';
import { NFTS_PER_PAGE } from '../constants';
import { type NftData, nftListSchema } from '../schemas';

// TODO: Remove once CoinGecko lists Lido's Ethereum withdrawal NFT.
const UNSTETH_WITHDRAWAL_QUEUE = '0x889edc2edab5f40e902b864ad4d7ade8e412f9b1';

const fetchNftList = coinGeckoApi('/nfts/list', {
    method: 'GET',
    schema: nftListSchema,
});

const fetchNftPage = (page: number, assetPlatformId: string) =>
    fetchNftList({
        headers: getCoinGeckoHeaders(),
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

    const contractAddresses: SimpleTokenStructure = unique(
        allData.map(item => item.contract_address),
    );
    if (
        assetPlatformId === 'ethereum' &&
        contractAddresses.length > 0 &&
        !contractAddresses.some(address => address.toLowerCase() === UNSTETH_WITHDRAWAL_QUEUE)
    ) {
        contractAddresses.push(UNSTETH_WITHDRAWAL_QUEUE);
    }

    return contractAddresses;
};
