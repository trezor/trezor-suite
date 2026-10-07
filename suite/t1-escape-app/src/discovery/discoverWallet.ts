import { type Result, ok } from '@trezor/type-utils';

import {
    type DiscoveryError,
    MAX_AUTOMATIC_ACCOUNTS,
    type ScannedAccount,
    isWalletEmpty,
    scanAccountRange,
} from './discoverAccounts';
import { discoverWalletCandidates } from './discoverWalletCandidates';
import type { WalletKind } from './scanReport';
import type { Backend } from '../backend/backend';
import type { AccountType } from '../bitcoin/accountType';
import type { DeviceCall } from '../device/deviceSession';
import type { PassphraseCandidates } from '../device/passphrase';

export type DiscoveredWallet = {
    walletKind: WalletKind;
    accounts: ScannedAccount[];
};

export type DiscoverWalletParams = {
    call: DeviceCall;
    backend: Backend;
    accountTypes: readonly AccountType[];
    /** Present when the device has passphrase protection turned on. */
    passphraseCandidates?: PassphraseCandidates;
    /** Chooses the passphrase the session answers with when the device asks for one. */
    setActivePassphrase: (passphrase: string) => void;
    onAccountScanned?: (account: ScannedAccount) => void;
};

type ScanAllAccountTypesParams = Pick<
    DiscoverWalletParams,
    'call' | 'backend' | 'accountTypes' | 'onAccountScanned'
>;

const scanAllAccountTypes = async ({
    accountTypes,
    ...params
}: ScanAllAccountTypesParams): Promise<Result<ScannedAccount[], DiscoveryError>> => {
    const accounts: ScannedAccount[] = [];

    for (const accountType of accountTypes) {
        const scanned = await scanAccountRange({
            ...params,
            accountType,
            firstIndex: 0,
            count: MAX_AUTOMATIC_ACCOUNTS,
            stopAtFirstEmpty: true,
        });
        if (!scanned.success) return scanned;

        accounts.push(...scanned.payload);
    }

    return ok(accounts);
};

/**
 * Runs the standard Bitcoin discovery of the wallet the device currently unlocks, trying the
 * passphrase candidates the way `discoverWalletCandidates` describes.
 */
export const discoverWallet = async ({
    passphraseCandidates,
    setActivePassphrase,
    ...params
}: DiscoverWalletParams): Promise<Result<DiscoveredWallet, DiscoveryError>> => {
    const discovered = await discoverWalletCandidates({
        call: params.call,
        passphraseCandidates,
        setActivePassphrase,
        scan: () => scanAllAccountTypes(params),
        isWalletEmpty,
    });
    if (!discovered.success) return discovered;

    const { walletKind, scanned } = discovered.payload;

    return ok({ walletKind, accounts: scanned });
};
