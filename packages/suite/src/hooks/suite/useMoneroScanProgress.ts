import { useCallback, useEffect, useRef, useState } from 'react';

import { selectSelectedDevice } from '@suite-common/device';
import { addLog } from '@suite-common/logger';
import { fetchAndUpdateAccountThunk } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import TrezorConnect from '@trezor/connect';

import { useDispatch, useSelector } from 'src/hooks/suite';

export interface MoneroScanProgress {
    scannedHeight: number;
    chainHeight: number;
    isSynced: boolean;
    startHeight: number;
    startTimestamp: number;
}

export interface MoneroBirthday {
    year: number;
    month: number; // 1-12
}

const POLL_MS = 8_000;

// Consecutive failed polls before we surface an "unreachable" state. At POLL_MS this is ~24s, long
// enough to ride out a freshly-published onion still propagating, short enough that a genuinely
// offline totem doesn't leave the account view spinning forever with no explanation.
const UNREACHABLE_THRESHOLD = 3;

// Last reported scan state per descriptor, kept across remounts. Switching account tabs (transactions
// ↔ details) remounts this hook; without a seed the first render would show the sync loader until the
// first poll returns, briefly flashing it over an already-synced account. Seeding from here avoids it.
const scanCache = new Map<string, MoneroScanProgress>();

/**
 * Drives a Monero account's client-side view-key scan and reports its progress.
 *
 * Descriptor-only polls (no device) ask the backend for progress. The backend resumes a persisted
 * wallet automatically (no device), reporting `misc.moneroScan`; on a brand-new account with nothing
 * persisted it reports `misc.moneroNeedsArm`, and the caller shows the birthday picker. `startScan`
 * then exports the view key (one on-device confirmation) and hands over the birthday, which builds +
 * persists the scanning wallet. Polls also keep the redux account balance/history in step as the
 * wallet finds outputs. Enable it only once the node is synced — there is nothing to scan before that.
 */
export const useMoneroScanProgress = (account: Account | undefined, enabled: boolean) => {
    const dispatch = useDispatch();
    const device = useSelector(selectSelectedDevice);
    // Seed from the cross-remount cache so navigating tabs doesn't flash the loader over a synced account.
    const [scan, setScan] = useState<MoneroScanProgress | null>(() =>
        account?.descriptor ? (scanCache.get(account.descriptor) ?? null) : null,
    );
    const [needsArm, setNeedsArm] = useState(false);
    // A remote (Totem) node reached over Tor can be briefly or permanently unreachable. Track
    // consecutive poll failures so the view can show an error instead of an endless spinner.
    const [unreachable, setUnreachable] = useState(false);
    const failuresRef = useRef(0);

    const descriptor = account?.descriptor;
    const path = account?.path;
    const accountKey = account?.key;

    // Path-based arming derives from the device, so it must target the selected device session —
    // otherwise connect prompts for passphrase/device selection. Descriptor-only polls don't need it.
    const devicePath = device?.path;
    const deviceInstance = device?.instance;
    const deviceState = device?.state;
    const useEmptyPassphrase = device?.useEmptyPassphrase;

    const startScan = useCallback(
        // `reset` interrupts an in-progress scan and rebuilds the wallet from the new birthday (the
        // user changed their mind about the restore date); otherwise this is the first arming.
        async (birthday: MoneroBirthday, { reset = false }: { reset?: boolean } = {}) => {
            if (!descriptor) return;

            setNeedsArm(false);
            dispatch(addLog({ type: 'monero-scan', payload: { at: 'arm', reset, birthday } }));

            try {
                if (reset) {
                    // Re-arm only: descriptor-only (no device). The backend reuses the wallet's own
                    // view key, so the device isn't prompted again just to change the birthday.
                    scanCache.delete(descriptor);
                    setScan(null);
                    const result = await TrezorConnect.getAccountInfo({
                        coin: 'xmr',
                        descriptor,
                        moneroRestoreDate: birthday,
                        moneroResetScan: true,
                        details: 'basic',
                        suppressBackupWarning: true,
                    });
                    dispatch(
                        addLog({
                            type: 'monero-scan',
                            payload: {
                                at: 'arm-result',
                                reset,
                                success: result.success,
                                error: result.success ? undefined : result,
                            },
                        }),
                    );

                    return;
                }

                if (!path || !devicePath) return;

                // First arm: export the view key from the device and hand the backend the birthday;
                // the backend builds + persists the scanning wallet starting from that height.
                const result = await TrezorConnect.getAccountInfo({
                    coin: 'xmr',
                    path,
                    device: {
                        path: devicePath,
                        instance: deviceInstance,
                        state: deviceState,
                        useEmptyPassphrase,
                    },
                    moneroRestoreDate: birthday,
                    details: 'basic',
                    suppressBackupWarning: true,
                });
                dispatch(
                    addLog({
                        type: 'monero-scan',
                        payload: {
                            at: 'arm-result',
                            success: result.success,
                            error: result.success ? undefined : result,
                        },
                    }),
                );
            } catch (error) {
                dispatch(
                    addLog({
                        type: 'monero-scan',
                        payload: { at: 'arm-exception', message: String(error) },
                    }),
                );
            }
        },
        [descriptor, path, devicePath, deviceInstance, deviceState, useEmptyPassphrase, dispatch],
    );

    useEffect(() => {
        if (!enabled || !descriptor) {
            setScan(null);
            setNeedsArm(false);
            setUnreachable(false);
            failuresRef.current = 0;

            return;
        }

        // Reset the failure state when (re)starting polling for a new account/backend.
        failuresRef.current = 0;
        setUnreachable(false);

        let cancelled = false;
        let timer: ReturnType<typeof setTimeout>;

        const poll = async () => {
            try {
                const result = await TrezorConnect.getAccountInfo({
                    coin: 'xmr',
                    descriptor,
                    details: 'basic',
                    suppressBackupWarning: true,
                });
                if (cancelled) return;
                if (!result.success) {
                    // Mirrored into the app log (Settings → Show log) to make a remote-backend scan
                    // debuggable — a silent failure here is why the birthday picker can loop.
                    dispatch(
                        addLog({
                            type: 'monero-scan',
                            payload: { at: 'poll', error: result },
                        }),
                    );
                    failuresRef.current += 1;
                    if (failuresRef.current >= UNREACHABLE_THRESHOLD) setUnreachable(true);

                    return;
                }

                // A successful response means the node is reachable again — clear any error state.
                failuresRef.current = 0;
                setUnreachable(false);

                const { misc } = result.payload;
                if (misc?.moneroScan) {
                    dispatch(
                        addLog({
                            type: 'monero-scan',
                            payload: { at: 'progress', ...misc.moneroScan },
                        }),
                    );
                    scanCache.set(descriptor, misc.moneroScan);
                    setScan(misc.moneroScan);
                    setNeedsArm(false);
                    // Pull the scanned balance/history into the redux account as the wallet finds outputs.
                    if (accountKey) {
                        dispatch(fetchAndUpdateAccountThunk({ accountKey }));
                    }
                } else if (misc?.moneroNeedsArm) {
                    dispatch(addLog({ type: 'monero-scan', payload: { at: 'needs-arm' } }));
                    setNeedsArm(true);
                    setScan(null);
                } else {
                    // The wallet is still being opened/built — keep the current state (a loader).
                    dispatch(addLog({ type: 'monero-scan', payload: { at: 'building' } }));
                }
            } catch (error) {
                dispatch(
                    addLog({
                        type: 'monero-scan',
                        payload: { at: 'poll-exception', message: String(error) },
                    }),
                );
                if (!cancelled) {
                    failuresRef.current += 1;
                    if (failuresRef.current >= UNREACHABLE_THRESHOLD) setUnreachable(true);
                }
            }
        };

        // Self-rescheduling loop: await each poll before scheduling the next, so a slow (>POLL_MS)
        // Monero scan can't stack overlapping in-flight getAccountInfo requests.
        const loop = async () => {
            await poll();
            if (!cancelled) {
                timer = setTimeout(loop, POLL_MS);
            }
        };
        loop();

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [descriptor, accountKey, enabled, dispatch]);

    return { scan, needsArm, unreachable, startScan };
};
