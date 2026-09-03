import type { StellarHorizonServer } from '../../types';
import type { StellarAssetRef } from '../../types/account';
import { isNotFoundError } from '../api';

/**
 * Lists the classic assets an account holds a trustline to.
 *
 * Stellar RPC cannot enumerate ledger entries, so the set of assets to look up has to come from
 * somewhere. Horizon is the only source that reports all of them, including assets outside the
 * curated definitions. `undefined` means the account does not exist.
 */
export const discoverTrustlineAssets = async (
    horizon: StellarHorizonServer,
    descriptor: string,
): Promise<StellarAssetRef[] | undefined> => {
    try {
        const { balances } = await horizon.accounts().accountId(descriptor).call();

        return balances.reduce<StellarAssetRef[]>((assets, balance) => {
            if (
                (balance.asset_type === 'credit_alphanum4' ||
                    balance.asset_type === 'credit_alphanum12') &&
                balance.asset_code &&
                balance.asset_issuer
            ) {
                return [
                    ...assets,
                    { assetCode: balance.asset_code, assetIssuer: balance.asset_issuer },
                ];
            }

            return assets;
        }, []);
    } catch (error) {
        // Other errors (rate limiting, outage) must not be reported as an empty account.
        if (isNotFoundError(error)) {
            return undefined;
        }

        throw error;
    }
};
