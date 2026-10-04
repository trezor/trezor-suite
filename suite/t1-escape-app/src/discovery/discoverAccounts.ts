import { type Result, ok } from '@trezor/type-utils';

import type { Backend, BackendError } from '../backend/backend';
import type { AccountType } from '../bitcoin/accountType';
import {
    type AccountPublicKeyError,
    type DiscoveredAccount,
    getAccountPublicKey,
} from '../device/accountPublicKey';
import type { DeviceCall } from '../device/deviceSession';
import { type AccountSnapshot, loadAccountSnapshot } from '../migration/accountSnapshot';

/** Hard stop for the automatic walk, so a backend claiming endless history cannot stall it. */
export const MAX_AUTOMATIC_ACCOUNTS = 20;

/** Number of further account indexes scanned per account type by "scan more accounts". */
export const SCAN_MORE_ACCOUNTS_STEP = 5;

export type ScannedAccount = {
    account: DiscoveredAccount;
    snapshot: AccountSnapshot;
    /** No transaction and no balance, neither with the standard nor with the deep address gap. */
    isEmpty: boolean;
};

export type DiscoveryError = AccountPublicKeyError | BackendError;

export type ScanAccountParams = {
    call: DeviceCall;
    backend: Backend;
    accountType: AccountType;
    accountIndex: number;
};

/**
 * Scans one account: the public key comes from the device, the history from the backend. The
 * first backend pass uses the standard address gap, the second one the deep gap.
 */
export const scanAccount = async ({
    call,
    backend,
    accountType,
    accountIndex,
}: ScanAccountParams): Promise<Result<ScannedAccount, DiscoveryError>> => {
    const account = await getAccountPublicKey({ call, accountType, accountIndex });
    if (!account.success) return account;

    const standardScan = await backend.getAccountInfo({
        descriptor: account.payload.descriptor,
        details: 'basic',
    });
    if (!standardScan.success) return standardScan;

    const snapshot = await loadAccountSnapshot({ backend, account: account.payload });
    if (!snapshot.success) return snapshot;

    return ok({
        account: account.payload,
        snapshot: snapshot.payload,
        isEmpty: standardScan.payload.empty && snapshot.payload.info.empty,
    });
};

export type ScanAccountRangeParams = Omit<ScanAccountParams, 'accountIndex'> & {
    firstIndex: number;
    /** Number of accounts to scan when `stopAtFirstEmpty` is not set. */
    count: number;
    /** Standard discovery: stop after the first account without any history. */
    stopAtFirstEmpty: boolean;
    onAccountScanned?: (account: ScannedAccount) => void;
};

/** Scans consecutive accounts of one type. The empty account that ends the walk is included. */
export const scanAccountRange = async ({
    firstIndex,
    count,
    stopAtFirstEmpty,
    onAccountScanned,
    ...params
}: ScanAccountRangeParams): Promise<Result<ScannedAccount[], DiscoveryError>> => {
    const scanned: ScannedAccount[] = [];

    for (let offset = 0; offset < count; offset++) {
        const result = await scanAccount({ ...params, accountIndex: firstIndex + offset });
        if (!result.success) return result;

        scanned.push(result.payload);
        onAccountScanned?.(result.payload);

        if (stopAtFirstEmpty && result.payload.isEmpty) break;
    }

    return ok(scanned);
};

/** True when no scanned account has ever been used. Decides the raw-passphrase fallback. */
export const isWalletEmpty = (accounts: readonly ScannedAccount[]) =>
    accounts.every(({ isEmpty }) => isEmpty);
