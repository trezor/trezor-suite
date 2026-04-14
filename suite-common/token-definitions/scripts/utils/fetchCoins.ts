/* eslint-disable no-console */
import * as toml from 'toml';

import { blockfrostUtils } from '@trezor/blockchain-link-utils';

import {
    AdvancedTokenStructure,
    SimpleTokenStructure,
    TokenStructureType,
} from '../../src/tokenDefinitionsTypes';
import { COIN_LIST_URL, STELLAR_EXPERT_URL, STELLAR_HORIZON_URL } from '../constants';
import { CoinData } from '../types';

const normalizeStellarAssetAddress = (address: string): string | undefined => {
    // Stellar address format: CODE-ISSUER, CODE:ISSUER, or CODE-ISSUER-NUMBER
    // CODE: 1-12 alphanumeric characters
    // ISSUER: 56 characters starting with 'G'
    // NUMBER: optional numeric suffix
    const stellarMatch = address.match(/^([A-Za-z0-9]{1,12})[-:]([G][A-Z0-9]{55})(?:-\d+)?$/);

    if (!stellarMatch) {
        return undefined;
    }

    const code = stellarMatch[1];
    const issuer = stellarMatch[2];

    return `${code}-${issuer}`;
};

const isSorobanContractAddress = (address: string) => /^C[A-Z0-9]{55}$/.test(address);

type StellarExpertContractData = {
    asset?: string;
};

const fetchSorobanContractAsset = async (contractAddress: string): Promise<string | undefined> => {
    try {
        const response = await fetch(`${STELLAR_EXPERT_URL}/contract/${contractAddress}`);
        if (!response.ok) {
            console.warn(
                `StellarExpert API returned ${response.status} for contract ${contractAddress}`,
            );

            return undefined;
        }

        const data = (await response.json()) as StellarExpertContractData;
        if (typeof data.asset !== 'string') {
            console.warn(`StellarExpert contract ${contractAddress} does not contain an asset.`);

            return undefined;
        }

        const normalizedAssetAddress = normalizeStellarAssetAddress(data.asset);
        if (!normalizedAssetAddress) {
            console.warn(
                `StellarExpert contract ${contractAddress} returned invalid asset ${data.asset}`,
            );

            return undefined;
        }

        return normalizedAssetAddress;
    } catch (error) {
        console.warn(`Error fetching Stellar contract asset for ${contractAddress}:`, error);

        return undefined;
    }
};

/**
 * Resolve a Stellar address to the normalized CODE-ISSUER format.
 * Handles both classic Stellar asset addresses (CODE-ISSUER, CODE:ISSUER)
 * and Soroban contract addresses (C...) by looking up the underlying asset
 * via the StellarExpert API.
 */
const resolveStellarAddress = async (address: string): Promise<string | undefined> => {
    const normalizedAssetAddress = normalizeStellarAssetAddress(address);
    if (normalizedAssetAddress) {
        return normalizedAssetAddress;
    }

    if (!isSorobanContractAddress(address)) {
        return undefined;
    }

    return await fetchSorobanContractAsset(address);
};

export const getContractAddress = async (
    assetPlatformId: string,
    platforms: CoinData['platforms'],
): Promise<string | undefined> => {
    const address = platforms[assetPlatformId];
    if (!address) {
        return undefined;
    }

    if (assetPlatformId === 'cardano') {
        return blockfrostUtils.parseAsset(address).policyId;
    }

    if (assetPlatformId === 'stellar') {
        return await resolveStellarAddress(address);
    }

    return address;
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
            const contractAddress = await getContractAddress(assetPlatformId, platforms);
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

    const contractAddresses = new Set<string>();

    for (const { platforms } of allCoins) {
        const contractAddress = await getContractAddress(assetPlatformId, platforms);
        if (!contractAddress) {
            continue;
        }

        contractAddresses.add(contractAddress);
    }

    return [...contractAddresses];
};
