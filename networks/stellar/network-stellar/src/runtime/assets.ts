import { Asset, Networks, StrKey } from '@stellar/stellar-sdk';

import type { StellarAssetRef } from '../types/account';

export const isValidAssetCode = (code: string): boolean => /^[a-zA-Z0-9]{1,12}$/.test(code);

export const isValidAddress = (address: string): boolean => StrKey.isValidEd25519PublicKey(address);

export const isValidContractId = (address: string): boolean => StrKey.isValidContract(address);

/**
 * Derive the public-network Soroban contract id for a classic Stellar asset
 * in strict `CODE-ISSUER` form.
 *
 * This is intentionally hard-coded to `Networks.PUBLIC`.
 */
export const computeSorobanAssetContractId = (classicAssetContract: string) => {
    const contractParts = classicAssetContract.split('-');
    const [assetCode, assetIsuer] = contractParts;

    if (contractParts.length !== 2 || !assetCode || !assetIsuer) {
        throw new Error('Invalid Stellar asset contract format.');
    }

    if (!isValidAssetCode(assetCode) || !isValidAddress(assetIsuer)) {
        throw new Error('Invalid Stellar asset contract format.');
    }

    return {
        assetCode,
        assetIsuer,
        sorobanAssetContractId: new Asset(assetCode, assetIsuer).contractId(Networks.PUBLIC),
    };
};

/**
 * Splits a classic asset contract in `CODE-ISSUER` form. Returns `undefined` for anything that
 * is not one — a Soroban contract id, or a key from a source Suite does not control.
 */
export const parseClassicAssetContract = (contract: string): StellarAssetRef | undefined => {
    const [assetCode, assetIssuer, ...rest] = contract.split('-');

    if (rest.length > 0 || !assetCode || !assetIssuer) {
        return undefined;
    }

    if (!isValidAssetCode(assetCode) || !isValidAddress(assetIssuer)) {
        return undefined;
    }

    return { assetCode, assetIssuer };
};
