import { type Result, ok } from '@trezor/type-utils';

import {
    type DiscoveryError,
    MAX_AUTOMATIC_ACCOUNTS,
    type ScannedAccount,
    isWalletEmpty,
    scanAccountRange,
} from './discoverAccounts';
import type { WalletKind } from './scanReport';
import { diagnosticLog } from '../app/diagnosticLog';
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
 * Runs the standard discovery of the wallet the device currently unlocks.
 *
 * With a passphrase the NFKD-normalized form is tried first. If that wallet turns out empty and
 * normalization changed the typed text, the wallet under the text exactly as typed is scanned as
 * well, because some old clients sent passphrases without normalizing them.
 */
export const discoverWallet = async ({
    passphraseCandidates,
    setActivePassphrase,
    ...params
}: DiscoverWalletParams): Promise<Result<DiscoveredWallet, DiscoveryError>> => {
    if (!passphraseCandidates) {
        const accounts = await scanAllAccountTypes(params);

        return accounts.success
            ? ok({ walletKind: 'standard', accounts: accounts.payload })
            : accounts;
    }

    const { normalized, raw } = passphraseCandidates;

    const describeCandidate = (passphrase: string) => {
        if (passphrase === '') return 'empty';

        return passphrase === normalized ? 'normalized' : 'raw';
    };

    // Initialize makes this firmware forget the cached passphrase, so the next call asks for
    // it again and receives the candidate chosen here.
    const selectPassphrase = (passphrase: string) => {
        // Which candidate is in use is logged, the passphrase itself never.
        diagnosticLog.info('discovery', 'selecting wallet', {
            passphrase: describeCandidate(passphrase),
        });
        setActivePassphrase(passphrase);

        return params.call('Initialize', 'Features');
    };

    const selectedNormalized = await selectPassphrase(normalized);
    if (!selectedNormalized.success) return selectedNormalized;

    const normalizedAccounts = await scanAllAccountTypes(params);
    if (!normalizedAccounts.success) return normalizedAccounts;

    const normalizedWallet: DiscoveredWallet = {
        walletKind: normalized === '' ? 'standard' : 'passphrase-normalized',
        accounts: normalizedAccounts.payload,
    };
    if (raw === undefined || !isWalletEmpty(normalizedAccounts.payload))
        return ok(normalizedWallet);

    const selectedRaw = await selectPassphrase(raw);
    if (!selectedRaw.success) return selectedRaw;

    const rawAccounts = await scanAllAccountTypes(params);
    if (!rawAccounts.success) return rawAccounts;

    if (!isWalletEmpty(rawAccounts.payload)) {
        return ok({ walletKind: 'passphrase-raw', accounts: rawAccounts.payload });
    }

    // Both wallets are empty. Return to the normalized one, which is the regular choice.
    const reselectedNormalized = await selectPassphrase(normalized);

    return reselectedNormalized.success ? ok(normalizedWallet) : reselectedNormalized;
};
