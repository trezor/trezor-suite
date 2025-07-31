/* eslint-disable no-console */
import { blockfrostUtils } from '@trezor/blockchain-link-utils';

import { AdvancedTokenStructure, SimpleTokenStructure } from '../../src/tokenDefinitionsTypes';
import { COIN_LIST_URL } from '../constants';
import { CoinData } from '../types';

export const getContractAddress = (assetPlatformId: string, platforms: CoinData['platforms']) => {
    const address = platforms[assetPlatformId];
    if (address) {
        if (assetPlatformId === 'cardano') {
            return blockfrostUtils.parseAsset(address).policyId;
        }

        if (assetPlatformId === 'stellar') {
            // Stellar address format: CODE-ISSUER, CODE:ISSUER, or CODE-ISSUER-NUMBER
            // CODE: 1-12 alphanumeric characters
            // ISSUER: 56 characters starting with 'G'
            // NUMBER: optional numeric suffix
            const stellarMatch = address.match(
                /^([A-Za-z0-9]{1,12})[-:]([G][A-Z0-9]{55})(?:-\d+)?$/,
            );
            if (stellarMatch) {
                const code = stellarMatch[1];
                const issuer = stellarMatch[2];

                return `${code}-${issuer}`; // Return as CODE-ISSUER format
            } else {
                return undefined; // Invalid Stellar address format
            }
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
