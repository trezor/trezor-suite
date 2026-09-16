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

/** `undefined` means Horizon has not seen the account, which is not proof it does not exist. */
export const fetchAccountRecord = async (
    horizon: StellarHorizonServer,
    descriptor: string,
): Promise<AccountRecord | undefined> => {
    try {
        return await horizon.accounts().accountId(descriptor).call();
    } catch (error) {
        if (isNotFoundError(error)) {
            return undefined;
        }

        throw error;
    }
};

/** Every trustline of the account, including assets outside the curated definitions. */
export const readTrustlineAssets = (record: AccountRecord): StellarAssetRef[] =>
    record.balances.filter(isClassicBalance).map(balance => ({
        assetCode: balance.asset_code,
        assetIssuer: balance.asset_issuer,
    }));

/** The Horizon stand-in for the RPC read; contract-token balances are out of its reach. */
export const readAccountStateFromHorizon = (record: AccountRecord): StellarAccountState => {
    const native = record.balances?.find(balance => balance.asset_type === 'native');

    // A truncated record would turn into a `NaN` reserve downstream.
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
