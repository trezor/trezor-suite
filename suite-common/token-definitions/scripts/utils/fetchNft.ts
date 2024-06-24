/* eslint-disable no-console */
import { NFTS_PER_PAGE, NFT_LIST_URL } from '../constants';
import { AdvancedTokenStructure, SimpleTokenStructure } from '../../src/tokenDefinitionsTypes';
import { NftData } from '../types';

const fetchNftPage = async (page: number, assetPlatformId: string): Promise<NftData[]> => {
    const params = new URLSearchParams({
        page: page.toString(),
        per_page: NFTS_PER_PAGE.toString(),
        asset_platform_id: assetPlatformId,
    });

    const options = {
        method: 'GET',
        headers: { 'x-cg-pro-api-key': process.env.COINGECKO_API_KEY! },
    };

    try {
        const response = await fetch(`${NFT_LIST_URL}?${params.toString()}`, options);
        if (!response.ok) {
            const { error } = await response.json();

            throw new Error(`${error}, status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        throw new Error(error);
    }
};

export const fetchNftData = async (assetPlatformId: string, structure: string) => {
    console.log('Start fetching NFT data for:', assetPlatformId, 'platform');

    let page = 1;
    let allData: NftData[] = [];

    while (true) {
        const data = await fetchNftPage(page, assetPlatformId);

        allData = allData.concat(data);
        page++;

        if (data.length < NFTS_PER_PAGE) {
            break;
        }
    }

    console.log('Number of NFT records fetched:', allData.length);

    if (structure === 'advanced') {
        return allData.reduce<AdvancedTokenStructure>((acc, { contract_address, symbol, name }) => {
            acc[contract_address] = { symbol, name };

            return acc;
        }, {});
    } else {
        return [...new Set(allData.map(item => item.contract_address))] as SimpleTokenStructure;
    }
};
