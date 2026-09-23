/* eslint-disable no-console */
import * as toml from 'toml';

import { blockfrostUtils } from '@trezor/blockchain-link-utils';
import { type Result, err, ok } from '@trezor/type-utils';

import { AdvancedTokenStructure, TokenStructureType } from '../../src/tokenDefinitionsTypes';
import { COIN_LIST_URL, STELLAR_EXPERT_URL, STELLAR_HORIZON_URL } from '../constants';
import { CoinData } from '../types';
import { requestJson, requestText } from './request';

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

/**
 * Why a coin has no contract address on a platform.
 *
 * Everything but `LOOKUP_FAILED` is an answer, and the token is left out of the definitions on
 * purpose. `LOOKUP_FAILED` means the build never found out, which has to fail the run: a token
 * dropped because an API was rate limited is indistinguishable, in the published file, from a
 * token that does not exist.
 */
export type ContractAddressError =
    | { type: 'NOT_ON_PLATFORM' }
    | { type: 'CONTRACT_HAS_NO_ASSET'; contractAddress: string }
    | { type: 'UNSUPPORTED_ADDRESS_FORMAT'; address: string }
    | { type: 'LOOKUP_FAILED'; reason: string };

const fetchSorobanContractAsset = async (
    contractAddress: string,
): Promise<Result<string, ContractAddressError>> => {
    const result = await requestJson<StellarExpertContractData>(
        `${STELLAR_EXPERT_URL}/contract/${contractAddress}`,
    );

    if (!result.success) {
        return result.error.type === 'NOT_FOUND'
            ? err({ type: 'CONTRACT_HAS_NO_ASSET', contractAddress })
            : err({
                  type: 'LOOKUP_FAILED',
                  reason: `StellarExpert contract ${contractAddress}: ${result.error.reason}`,
              });
    }

    const { asset } = result.payload;
    if (typeof asset !== 'string') {
        return err({ type: 'CONTRACT_HAS_NO_ASSET', contractAddress });
    }

    const normalizedAssetAddress = normalizeStellarAssetAddress(asset);
    if (!normalizedAssetAddress) {
        return err({ type: 'UNSUPPORTED_ADDRESS_FORMAT', address: asset });
    }

    return ok(normalizedAssetAddress);
};

/**
 * Resolve a Stellar address to the normalized CODE-ISSUER format.
 * Handles both classic Stellar asset addresses (CODE-ISSUER, CODE:ISSUER)
 * and Soroban contract addresses (C...) by looking up the underlying asset
 * via the StellarExpert API.
 */
const resolveStellarAddress = async (
    address: string,
): Promise<Result<string, ContractAddressError>> => {
    const normalizedAssetAddress = normalizeStellarAssetAddress(address);
    if (normalizedAssetAddress) {
        return ok(normalizedAssetAddress);
    }

    if (!isSorobanContractAddress(address)) {
        return err({ type: 'UNSUPPORTED_ADDRESS_FORMAT', address });
    }

    return await fetchSorobanContractAsset(address);
};

export const getContractAddress = async (
    assetPlatformId: string,
    platforms: CoinData['platforms'],
): Promise<Result<string, ContractAddressError>> => {
    const address = platforms[assetPlatformId];
    if (!address) {
        return err({ type: 'NOT_ON_PLATFORM' });
    }

    if (assetPlatformId === 'cardano') {
        return ok(blockfrostUtils.parseAsset(address).policyId);
    }

    if (assetPlatformId === 'stellar') {
        return await resolveStellarAddress(address);
    }

    return ok(address);
};

/**
 * Why an asset carries no verified home domain.
 *
 * `NOT_PUBLISHED` is a verified answer: the issuer publishes no domain, or its `stellar.toml`
 * does not list the asset. `NOT_VERIFIABLE` means the check never happened, usually because the
 * issuer's own domain is unreachable. Both leave the field out, but only the first one is a
 * statement about the asset.
 */
export type StellarHomeDomainError =
    { type: 'NOT_PUBLISHED' } | { type: 'NOT_VERIFIABLE'; reason: string };

type StellarAccountData = {
    home_domain?: string;
};

const fetchStellarHomeDomain = async (
    issuer: string,
): Promise<Result<string, StellarHomeDomainError>> => {
    const result = await requestJson<StellarAccountData>(
        `${STELLAR_HORIZON_URL}/accounts/${issuer}`,
    );

    if (!result.success) {
        return result.error.type === 'NOT_FOUND'
            ? err({ type: 'NOT_PUBLISHED' })
            : err({
                  type: 'NOT_VERIFIABLE',
                  reason: `Horizon account ${issuer}: ${result.error.reason}`,
              });
    }

    return result.payload.home_domain
        ? ok(result.payload.home_domain)
        : err({ type: 'NOT_PUBLISHED' });
};

interface StellarCurrency {
    code: string;
    issuer: string;
}

interface StellarToml {
    CURRENCIES?: StellarCurrency[];
}

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
): Promise<Result<void, StellarHomeDomainError>> => {
    const result = await requestText(`https://${homeDomain}/.well-known/stellar.toml`);

    if (!result.success) {
        return result.error.type === 'NOT_FOUND'
            ? err({ type: 'NOT_PUBLISHED' })
            : err({
                  type: 'NOT_VERIFIABLE',
                  reason: `stellar.toml of ${homeDomain}: ${result.error.reason}`,
              });
    }

    let parsed: StellarToml;
    try {
        parsed = toml.parse(result.payload) as StellarToml;
    } catch (error) {
        return err({
            type: 'NOT_VERIFIABLE',
            reason: `stellar.toml of ${homeDomain} is malformed: ${error instanceof Error ? error.message : String(error)}`,
        });
    }

    const currency = parsed.CURRENCIES?.find(c => c.code === code && c.issuer === issuer);

    return currency ? ok() : err({ type: 'NOT_PUBLISHED' });
};

/**
 * Get and verify Stellar home_domain for a given asset
 * Fetches home_domain from Horizon API and verifies it in stellar.toml
 * This ensures the asset is officially published by the issuer
 */
const getStellarHomeDomain = async (
    contractAddress: string,
): Promise<Result<string, StellarHomeDomainError>> => {
    const [code, issuer] = contractAddress.split('-');
    if (!code || !issuer) {
        return err({ type: 'NOT_PUBLISHED' });
    }

    const homeDomain = await fetchStellarHomeDomain(issuer);
    if (!homeDomain.success) {
        return homeDomain;
    }

    const verified = await verifyStellarToml(homeDomain.payload, code, issuer);

    return verified.success ? ok(homeDomain.payload) : err(verified.error);
};

export type StellarRatingError = { type: 'UNRATED' } | { type: 'LOOKUP_FAILED'; reason: string };

type StellarExpertRatingData = {
    rating?: { average?: number };
};

/**
 * Fetch Stellar token rating from StellarExpert API
 *
 * @see https://stellar.expert/openapi.html#tag/Asset-Info-API/operation/getAssetRating
 */
const fetchStellarTokenRating = async (
    contractAddress: string,
): Promise<Result<number, StellarRatingError>> => {
    const result = await requestJson<StellarExpertRatingData>(
        `${STELLAR_EXPERT_URL}/asset/${contractAddress}/rating`,
    );

    if (!result.success) {
        return result.error.type === 'NOT_FOUND'
            ? err({ type: 'UNRATED' })
            : err({
                  type: 'LOOKUP_FAILED',
                  reason: `StellarExpert rating ${contractAddress}: ${result.error.reason}`,
              });
    }

    const average = result.payload.rating?.average;

    return typeof average === 'number' ? ok(average) : err({ type: 'UNRATED' });
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
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`fetchAllCoins error: ${message}`, { cause: error });
    }
};

/**
 * A token left out because a lookup failed, rather than because the answer said to leave it out.
 * Collected instead of thrown, so one run reports every asset it could not resolve at once.
 */
export type FailedLookup = {
    coinId: string;
    reason: string;
};

/**
 * An enrichment that could not be checked, as opposed to one that is verifiably absent. It only
 * leaves a field out of an otherwise complete record, so it is reported rather than fatal.
 */
export type UncheckedEnrichment = {
    contractAddress: string;
    reason: string;
};

export type BuildCoinDataForPlatformResult = {
    /**
     * A Set for the simple structure rather than SimpleTokenStructure (string[]), so the caller
     * can merge extra addresses with `has`/`add` instead of a linear scan over tens of thousands
     * of contracts. Convert with `Array.from` before writing the definition files.
     */
    data: AdvancedTokenStructure | Set<string>;
    failedLookups: FailedLookup[];
    uncheckedEnrichments: UncheckedEnrichment[];
};

export const buildCoinDataForPlatform = async (
    allCoins: CoinData[],
    assetPlatformId: string,
    structure: TokenStructureType,
): Promise<BuildCoinDataForPlatformResult> => {
    const failedLookups: FailedLookup[] = [];
    const uncheckedEnrichments: UncheckedEnrichment[] = [];

    const resolveContractAddress = async ({ id, platforms }: CoinData) => {
        const result = await getContractAddress(assetPlatformId, platforms);

        if (!result.success) {
            if (result.error.type === 'LOOKUP_FAILED') {
                failedLookups.push({ coinId: id, reason: result.error.reason });
            }

            return undefined;
        }

        return result.payload;
    };

    if (structure === TokenStructureType.ADVANCED) {
        const result: AdvancedTokenStructure = {};

        for (const coin of allCoins) {
            const contractAddress = await resolveContractAddress(coin);
            if (!contractAddress) continue;

            result[contractAddress] = { symbol: coin.symbol, name: coin.name };

            if (assetPlatformId === 'stellar') {
                const homeDomain = await getStellarHomeDomain(contractAddress);
                if (homeDomain.success) {
                    result[contractAddress].home_domain = homeDomain.payload;
                } else if (homeDomain.error.type === 'NOT_VERIFIABLE') {
                    uncheckedEnrichments.push({
                        contractAddress,
                        reason: homeDomain.error.reason,
                    });
                }

                const rating = await fetchStellarTokenRating(contractAddress);
                if (rating.success) {
                    result[contractAddress].rating = rating.payload;
                } else if (rating.error.type === 'LOOKUP_FAILED') {
                    uncheckedEnrichments.push({ contractAddress, reason: rating.error.reason });
                }
            }
        }

        return { data: result, failedLookups, uncheckedEnrichments };
    }

    const contractAddresses = new Set<string>();

    for (const coin of allCoins) {
        const contractAddress = await resolveContractAddress(coin);
        if (!contractAddress) continue;

        contractAddresses.add(contractAddress);
    }

    return { data: contractAddresses, failedLookups, uncheckedEnrichments };
};
