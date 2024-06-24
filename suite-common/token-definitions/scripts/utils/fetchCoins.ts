/* eslint-disable no-console */
import { blockfrostUtils } from '@trezor/blockchain-link-utils';

import { COIN_LIST_URL } from '../constants';
import { AdvancedTokenStructure, SimpleTokenStructure } from '../../src/tokenDefinitionsTypes';
import { CoinData } from '../types';

const getContractAddress = (assetPlatformId: string, platforms: CoinData['platforms']) => {
    const address = platforms[assetPlatformId];
    if (address) {
        if (assetPlatformId === 'cardano') {
            return blockfrostUtils.parseAsset(address).policyId;
        }

        return address;
    }

    return undefined;
};

export const fetchCoinData = async (assetPlatformId: string, structure: string) => {
    console.log('Start fetching coin data for:', assetPlatformId, 'platform');

    const params = new URLSearchParams({
        include_platform: true.toString(),
    });

    const options = {
        method: 'GET',
        headers: { 'x-cg-pro-api-key': process.env.COINGECKO_API_KEY! },
    };

    let data: CoinData[];
    try {
        const response = await fetch(`${COIN_LIST_URL}?${params.toString()}`, options);
        if (!response.ok) {
            const { error } = await response.json();

            throw new Error(`${error}, status: ${response.status}`);
        }

        data = await response.json();
    } catch (error) {
        throw new Error(error);
    }

    console.log('Number of coin records fetched:', data.length);

    if (structure === 'advanced') {
        return data.reduce<AdvancedTokenStructure>((acc, { platforms, symbol, name }) => {
            const contractAddress = getContractAddress(assetPlatformId, platforms);
            if (contractAddress) {
                acc[contractAddress] = { symbol, name };
            }

            return acc;
        }, {});
    } else {
        return [
            ...new Set(
                data
                    .map(item => getContractAddress(assetPlatformId, item.platforms))
                    .filter(item => item),
            ),
        ] as SimpleTokenStructure;
    }
};
