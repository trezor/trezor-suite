import { Asset, Networks, StrKey } from '@stellar/stellar-sdk';

export const isValidAssetCode = (code: string): boolean => /^[a-zA-Z0-9]{1,12}$/.test(code);

export const isValidAddress = (address: string): boolean => StrKey.isValidEd25519PublicKey(address);

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
