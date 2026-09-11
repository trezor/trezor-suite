import { type Horizon } from '@stellar/stellar-sdk';

import { toStroops } from '../../constants';
import type { StellarHorizonServer } from '../../types';
import type { StellarAccountState, StellarAssetRef, StellarTrustline } from '../../types/account';
import { isNotFoundError } from '../api';

type AccountRecord = Horizon.ServerApi.AccountRecord;

const isClassicBalance = (
    balance: AccountRecord['balances'][number],
): balance is AccountRecord['balances'][number] & { asset_code: string; asset_issuer: string } =>
    (balance.asset_type === 'credit_alphanum4' || balance.asset_type === 'credit_alphanum12') &&
    !!balance.asset_code &&
    !!balance.asset_issuer;

/**
 * Fetches the Horizon account record. `undefined` means Horizon has not seen the account — which
 * is weaker than the ledger's own answer, so callers must not treat it as proof of absence.
 */
export const fetchAccountRecord = async (
    horizon: StellarHorizonServer,
    descriptor: string,
): Promise<AccountRecord | undefined> => {
    try {
        return await horizon.accounts().accountId(descriptor).call();
    } catch (error) {
        // Other errors (rate limiting, outage) must not be reported as an empty account.
        if (isNotFoundError(error)) {
            return undefined;
        }

        throw error;
    }
};

/**
 * Lists the classic assets an account holds a trustline to.
 *
 * Stellar RPC cannot enumerate ledger entries, so the set of assets to look up has to come from
 * somewhere. Horizon is the only source that reports all of them, including assets outside the
 * curated definitions.
 */
export const readTrustlineAssets = (record: AccountRecord): StellarAssetRef[] =>
    record.balances.filter(isClassicBalance).map(balance => ({
        assetCode: balance.asset_code,
        assetIssuer: balance.asset_issuer,
    }));

/**
 * Maps a Horizon account record onto the same shape the RPC path produces, for use when RPC is
 * unreachable. Everything except Soroban contract-token balances is available here — those live in
 * contract storage, which Horizon cannot see, so a degraded read reports the classic holdings only.
 *
 * Horizon reports balances as decimal lumen strings, hence the conversion the RPC path avoids.
 */
export const readAccountStateFromHorizon = (record: AccountRecord): StellarAccountState => {
    const native = record.balances?.find(balance => balance.asset_type === 'native');

    // A funded account always has a native balance, a sequence and a subentry count. Rejecting a
    // record without them keeps a truncated response from turning into a `NaN` reserve downstream:
    // the caller then reports the RPC failure that made us look at Horizon in the first place.
    if (!native || record.sequence === undefined || record.subentry_count === undefined) {
        throw new Error('Horizon account record is missing the fields a balance read needs');
    }

    const trustlines: StellarTrustline[] = record.balances
        .filter(isClassicBalance)
        .map(balance => ({
            assetCode: balance.asset_code,
            assetIssuer: balance.asset_issuer,
            balance: toStroops(balance.balance).toString(),
        }));

    return {
        exists: true,
        balance: toStroops(native.balance).toString(),
        sequence: record.sequence,
        numSubEntries: record.subentry_count,
        numSponsoring: record.num_sponsoring ?? 0,
        numSponsored: record.num_sponsored ?? 0,
        sellingLiabilities: native?.selling_liabilities
            ? toStroops(native.selling_liabilities).toString()
            : '0',
        trustlines,
    };
};
