import { arrayChunk } from '@trezor/utils';

import {
    computeSorobanAssetContractId,
    isValidContractId,
    parseClassicAssetContract,
} from './assets';
import type { StellarAssetRef } from '../types/account';

// Hashing hundreds of assets uninterrupted would drop frames on the paste that asks for it.
const SAC_INDEX_CHUNK_SIZE = 100;

// A SAC id is a one-way hash of the asset, so the way back is an index over every known asset.
const contractIndexes = new WeakMap<object, Promise<Map<string, StellarAssetRef>>>();

const buildSacContractIndex = async (contracts: readonly string[]) => {
    const index = new Map<string, StellarAssetRef>();

    for (const [batchIndex, batch] of arrayChunk(contracts, SAC_INDEX_CHUNK_SIZE).entries()) {
        // Hashing every known asset would hold the main thread in one block otherwise.
        if (batchIndex > 0) {
            await new Promise(resolve => {
                setTimeout(resolve, 0);
            });
        }

        batch.forEach(contract => {
            const asset = parseClassicAssetContract(contract);

            if (asset) {
                index.set(computeSorobanAssetContractId(contract).sorobanAssetContractId, asset);
            }
        });
    }

    return index;
};

const getSacContractIndex = (assetsByContract: Readonly<Record<string, unknown>>) => {
    const cached = contractIndexes.get(assetsByContract);
    if (cached) return cached;

    const pending = buildSacContractIndex(Object.keys(assetsByContract)).catch(error => {
        // A failed build says nothing about the definitions, so it must not be cached.
        contractIndexes.delete(assetsByContract);
        throw error;
    });

    contractIndexes.set(assetsByContract, pending);

    return pending;
};

/** Resolves a Stellar Asset Contract id to the classic asset it wraps, if `assetsByContract` lists it. */
export const resolveClassicAssetFromContractId = async (
    contractId: string,
    assetsByContract: Readonly<Record<string, unknown>>,
): Promise<StellarAssetRef | undefined> => {
    if (!isValidContractId(contractId)) return undefined;

    return (await getSacContractIndex(assetsByContract)).get(contractId);
};
