/* eslint-disable no-console */
import * as toml from 'toml';

import * as blockfrostUtils from '@trezor/blockchain-link-blockfrost/src/utils';

import {
    AdvancedTokenStructure,
    SimpleTokenStructure,
    TokenStructureType,
} from '../../src/tokenDefinitionsTypes';
import { COIN_LIST_URL, STELLAR_EXPERT_URL, STELLAR_HORIZON_URL } from '../constants';
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

interface StellarCurrency {
    code: string;
    issuer: string;
}

interface StellarToml {
    CURRENCIES?: StellarCurrency[];
}

/**
 * Fetch Stellar home_domain from Horizon API
 */
const fetchStellarHomeDomain = async (issuer: string): Promise<string | null> => {
    try {
        const response = await fetch(`${STELLAR_HORIZON_URL}/accounts/${issuer}`);
        if (!response.ok) {
            console.warn(`Stellar Horizon API returned ${response.status} for issuer ${issuer}`);

            return null;
        }
        const data = await response.json();

        return data.home_domain || null;
    } catch (error) {
        console.warn(`Error fetching Stellar home_domain for ${issuer}:`, error);

        return null;
    }
};

/**
 * Verify Stellar asset in stellar.toml file
 *
 * @see https://centre.io/.well-known/stellar.toml
 * @see https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0001.md
 */
const verifyStellarToml = async (
    homeDomain: string,
    code: string,
    issuer: string,
): Promise<boolean> => {
    try {
        const response = await fetch(`https://${homeDomain}/.well-known/stellar.toml`);
        if (!response.ok) {
            console.warn(`stellar.toml fetch returned ${response.status} for domain ${homeDomain}`);

            return false;
        }

        const tomlContent = await response.text();
        const parsed = toml.parse(tomlContent) as StellarToml;

        if (!parsed.CURRENCIES || !Array.isArray(parsed.CURRENCIES)) {
            return false;
        }

        const currency = parsed.CURRENCIES.find(c => c.code === code && c.issuer === issuer);

        return !!currency;
    } catch (error) {
        console.warn(`Error verifying stellar.toml for ${homeDomain}:`, error);

        return false;
    }
};

/**
 * Get and verify Stellar home_domain for a given asset
 * Fetches home_domain from Horizon API and verifies it in stellar.toml
 * This ensures the asset is officially published by the issuer
 */
const getStellarHomeDomain = async (contractAddress: string): Promise<string | undefined> => {
    const [code, issuer] = contractAddress.split('-');

    const homeDomain = await fetchStellarHomeDomain(issuer);
    if (!homeDomain) {
        return undefined;
    }

    const isValid = await verifyStellarToml(homeDomain, code, issuer);
    if (!isValid) {
        return undefined;
    }

    return homeDomain;
};

/**
 * Fetch Stellar token rating from StellarExpert API
 *
 * @see https://stellar.expert/openapi.html#tag/Asset-Info-API/operation/getAssetRating
 */
const fetchStellarTokenRating = async (contractAddress: string): Promise<number | undefined> => {
    try {
        const response = await fetch(`${STELLAR_EXPERT_URL}/asset/${contractAddress}/rating`);
        if (!response.ok) {
            console.warn(
                `StellarExpert API returned ${response.status} for asset ${contractAddress}`,
            );

            return undefined;
        }
        const data = await response.json();

        return data.rating?.average || undefined;
    } catch (error) {
        console.warn(`Error fetching Stellar token rating for ${contractAddress}:`, error);

        return undefined;
    }
};

const options = {
    method: 'GET',
    headers: { 'x-cg-pro-api-key': process.env.COINGECKO_API_KEY! },
};

export const fetchAllCoins = async (): Promise<CoinData[]> => {
    const params = new URLSearchParams({ include_platform: String(true) });

    try {
        const res = await fetch(`${COIN_LIST_URL}?${params.toString()}`, options);

        if (!res.ok) {
            let msg = `status: ${res.status}`;
            try {
                const { error } = await res.json();
                if (error) msg = `${error}, ${msg}`;
            } catch {
                // ignore JSON parse error
            }
            throw new Error(`CoinGecko coins/list failed: ${msg}`);
        }

        const data: CoinData[] = await res.json();
        console.log('Number of coin records fetched (ALL):', data.length);

        return data;
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        throw new Error(`fetchAllCoins error: ${message}`);
    }
};

export const buildCoinDataForPlatform = async (
    allCoins: CoinData[],
    assetPlatformId: string,
    structure: TokenStructureType,
): Promise<AdvancedTokenStructure | SimpleTokenStructure> => {
    if (structure === TokenStructureType.ADVANCED) {
        const result: AdvancedTokenStructure = {};

        for (const { platforms, symbol, name } of allCoins) {
            const contractAddress = getContractAddress(assetPlatformId, platforms);
            if (!contractAddress) continue;

            result[contractAddress] = { symbol, name };

            if (assetPlatformId === 'stellar') {
                const homeDomain = await getStellarHomeDomain(contractAddress);
                if (homeDomain) result[contractAddress].home_domain = homeDomain;

                const rating = await fetchStellarTokenRating(contractAddress);
                if (rating !== undefined) result[contractAddress].rating = rating;
            }
        }

        return result;
    }

    return [
        ...new Set(
            allCoins
                .map(item => getContractAddress(assetPlatformId, item.platforms))
                .filter(Boolean),
        ),
    ] as SimpleTokenStructure;
};
