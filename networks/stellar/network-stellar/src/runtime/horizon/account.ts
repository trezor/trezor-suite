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
 * `undefined` means Horizon has not seen the account, which is weaker than the ledger's own answer,
 * so callers must not treat it as proof of absence.
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
 * Lists the classic assets an account holds a trustline to. Stellar RPC cannot enumerate ledger
 * entries, and Horizon is the only source that reports all of them, including assets outside the
 * curated definitions.
 */
export const readTrustlineAssets = (record: AccountRecord): StellarAssetRef[] =>
    record.balances.filter(isClassicBalance).map(balance => ({
        assetCode: balance.asset_code,
        assetIssuer: balance.asset_issuer,
    }));

/**
 * Maps a Horizon account record onto the shape the RPC path produces, for when RPC is unreachable.
 * Only Soroban contract-token balances are missing — they live in contract storage, which Horizon
 * cannot see. Horizon reports balances as decimal lumen strings, hence the conversion.
 */
export const readAccountStateFromHorizon = (record: AccountRecord): StellarAccountState => {
    const native = record.balances?.find(balance => balance.asset_type === 'native');

    // A funded account always has a native balance, a sequence and a subentry count; rejecting a
    // truncated record keeps it from turning into a `NaN` reserve downstream.
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
