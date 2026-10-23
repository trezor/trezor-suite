import { type Result, ok } from '@trezor/type-utils';

import type { WalletKind } from './scanReport';
import { diagnosticLog } from '../app/diagnosticLog';
import type { DeviceCall, DeviceCallError } from '../device/deviceSession';
import type { PassphraseCandidates } from '../device/passphrase';

export type DiscoveredWalletCandidate<T> = {
    walletKind: WalletKind;
    scanned: T;
};

export type DiscoverWalletCandidatesParams<T, E> = {
    call: DeviceCall;
    /** Present when the device has passphrase protection turned on. */
    passphraseCandidates?: PassphraseCandidates;
    /** Chooses the passphrase the session answers with when the device asks for one. */
    setActivePassphrase: (passphrase: string) => void;
    /** Scans the wallet the device currently unlocks. */
    scan: () => Promise<Result<T, E>>;
    /** Decides the raw-passphrase fallback. Must answer false when the scan is incomplete. */
    isWalletEmpty: (scanned: T) => boolean;
};

/**
 * Runs a scan of the wallet the device currently unlocks, choosing the passphrase candidate.
 *
 * With a passphrase the NFKD-normalized form is tried first. If that wallet turns out empty and
 * normalization changed the typed text, the wallet under the text exactly as typed is scanned as
 * well, because some old clients sent passphrases without normalizing them.
 */
export const discoverWalletCandidates = async <T, E>({
    call,
    passphraseCandidates,
    setActivePassphrase,
    scan,
    isWalletEmpty,
}: DiscoverWalletCandidatesParams<T, E>): Promise<
    Result<DiscoveredWalletCandidate<T>, E | DeviceCallError>
> => {
    if (!passphraseCandidates) {
        const scanned = await scan();

        return scanned.success ? ok({ walletKind: 'standard', scanned: scanned.payload }) : scanned;
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

        return call('Initialize', 'Features');
    };

    const selectedNormalized = await selectPassphrase(normalized);
    if (!selectedNormalized.success) return selectedNormalized;

    const normalizedScan = await scan();
    if (!normalizedScan.success) return normalizedScan;

    const normalizedWallet: DiscoveredWalletCandidate<T> = {
        walletKind: normalized === '' ? 'standard' : 'passphrase-normalized',
        scanned: normalizedScan.payload,
    };
    if (raw === undefined || !isWalletEmpty(normalizedScan.payload)) return ok(normalizedWallet);

    const selectedRaw = await selectPassphrase(raw);
    if (!selectedRaw.success) return selectedRaw;

    const rawScan = await scan();
    if (!rawScan.success) return rawScan;

    if (!isWalletEmpty(rawScan.payload)) {
        return ok({ walletKind: 'passphrase-raw', scanned: rawScan.payload });
    }

    // Both wallets are empty. Return to the normalized one, which is the regular choice.
    const reselectedNormalized = await selectPassphrase(normalized);

    return reselectedNormalized.success ? ok(normalizedWallet) : reselectedNormalized;
};
