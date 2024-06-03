import { COIN_DATA_URL, COIN_LIST_URL, UPDATED_ICONS_LIST_URL } from '../constants';
import { CoinData, CoinListData, UpdatedIconsList } from '../types';
import { sleep } from './sleep';

const coingeckoApiOptions = {
    method: 'GET',
    headers: { 'x-cg-pro-api-key': process.env.COINGECKO_API_KEY! },
};

export const getUpdatedIconsList = async (): Promise<UpdatedIconsList> => {
    try {
        const response = await fetch(UPDATED_ICONS_LIST_URL);
        if (!response.ok) {
            throw new Error(`${response.status} ${response.statusText}`);
        }

        return response.json();
    } catch (error) {
        console.error('Failed to fetch updated icons list:', error);

        return {};
    }
};

export const getCoinList = async (): Promise<CoinListData[]> => {
    const params = new URLSearchParams({
        include_platform: true.toString(),
    });

    const response = await fetch(`${COIN_LIST_URL}?${params.toString()}`, coingeckoApiOptions);
    if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`);
    }

    return await response.json();
};

export const getCoinData = async (id: string, retry: boolean = true): Promise<CoinData> => {
    const params = new URLSearchParams({
        localization: false.toString(),
        tickers: false.toString(),
        market_data: false.toString(),
        community_data: false.toString(),
        developer_data: false.toString(),
        sparkline: false.toString(),
    });

    const response = await fetch(`${COIN_DATA_URL}${id}?${params.toString()}`, coingeckoApiOptions);
    if (!response.ok) {
        if (retry && response.status === 429) {
            console.error('Too many requests, waiting for 60 seconds...');
            await sleep(60 * 1000);

            return getCoinData(id, false);
        }

        throw new Error(`${response.status} ${response.statusText}`);
    }

    return await response.json();
};
