import {
    INITIAL_MIGRATION_STATE,
    type MigrationState,
    type Transfer,
    isTransferUnsettled,
} from './migrationState';
import type { Backend } from '../backend/backend';
import { getOutputScripts, validateDestination } from '../bitcoin/destinationAddress';
import type { DiscoveredAccount } from '../device/accountPublicKey';
import type { AcquiredDevice, BridgeConnection } from '../device/createBridgeConnection';
import { evaluateDeviceFeatures } from '../device/deviceFeatures';
import {
    type DeviceCallError,
    type DeviceLostReason,
    type DeviceSession,
    createDeviceSession,
} from '../device/deviceSession';
import { lockDevice } from '../device/lockDevice';
import { type PassphraseCandidates, validatePassphraseEntry } from '../device/passphrase';
import {
    SCAN_MORE_ACCOUNTS_STEP,
    type ScannedAccount,
    scanAccountRange,
} from '../discovery/discoverAccounts';
import { discoverWallet } from '../discovery/discoverWallet';
import { getDiscoverableAccountTypes } from '../firmware/firmwareSupport';
import { getAccountAddresses, loadAccountSnapshot } from '../migration/accountSnapshot';
import { type InFlightTransfer, evaluateAccountState } from '../migration/accountState';
import { prepareSweep } from '../migration/prepareSweep';
import { signSweep } from '../migration/signSweep';
import { type SweepLedger, createSweepLedger } from '../migration/sweepLedger';
import { type SweepStatus, broadcastSweep, evaluateSweepStatus } from '../migration/sweepStatus';
import { type EnvironmentInfo, getEnvironmentIssue } from '../preflight/environment';
import type { LocalNetworkAccessState } from '../preflight/localNetworkAccess';

export type MigrationControllerDeps = {
    bridge: BridgeConnection;
    backend: Backend;
    getEnvironmentInfo: () => EnvironmentInfo;
    queryLocalNetworkAccess: () => Promise<LocalNetworkAccessState>;
    getRandomInt: (min: number, max: number) => number;
};

export type MigrationController = {
    getState: () => MigrationState;
    subscribe: (listener: () => void) => () => void;
    runPreflight: () => Promise<void>;
    connectDevice: () => Promise<void>;
    submitPassphrase: (first: string, second: string) => Promise<void>;
    startDiscovery: () => Promise<void>;
    scanMoreAccounts: () => Promise<void>;
    confirmDiscovery: () => void;
    submitDestination: (input: string) => Promise<void>;
    /** Returns to the address entry. Possible only while nothing has been signed. */
    editDestination: () => void;
    /** Composes a transfer again after its preparation failed. */
    retryTransfer: (key: string) => Promise<void>;
    signTransfer: (key: string) => Promise<void>;
    broadcastTransfer: (key: string) => Promise<void>;
    refreshTransfers: () => Promise<void>;
    finish: () => Promise<void>;
    submitPin: (pin: string) => void;
    cancelPin: () => void;
    /** Best-effort release of the device when the page is being closed. */
    releaseOnUnload: () => void;
};

const getAccountKey = ({ accountType, accountIndex }: DiscoveredAccount) =>
    `${accountType}-${accountIndex}`;

const isDeviceLostError = (error: {
    type: string;
}): error is Extract<DeviceCallError, { type: 'device-lost' }> => error.type === 'device-lost';

/**
 * Runs the migration from the first screen to the last. It owns everything that lives only
 * in memory for the duration of the page: the device session, the passphrase, the ledger of
 * composed and signed transfers, and the state the screens render.
 */
export const createMigrationController = (deps: MigrationControllerDeps): MigrationController => {
    let state = INITIAL_MIGRATION_STATE;
    const listeners = new Set<() => void>();

    // These never enter `state`, so they can never end up rendered, serialized or logged.
    let activePassphrase: string | undefined;
    let passphraseCandidates: PassphraseCandidates | undefined;
    let resolvePin: ((pin: string | undefined) => void) | undefined;

    let acquiredDevice: AcquiredDevice | undefined;
    let session: DeviceSession | undefined;
    const ledger: SweepLedger = createSweepLedger();
    let transferSequence = 0;
    let isRefreshingTransfers = false;

    const setState = (patch: Partial<MigrationState>) => {
        state = { ...state, ...patch };
        listeners.forEach(listener => listener());
    };

    const updateTransfer = (key: string, patch: Partial<Transfer>) =>
        setState({
            transfers: state.transfers.map(transfer =>
                transfer.key === key ? { ...transfer, ...patch } : transfer,
            ),
        });

    // Only one action runs at a time. The device and the ledger are not built for more.
    const runExclusive = async (activity: string, action: () => Promise<void>) => {
        if (state.activity !== undefined) return;

        setState({ activity, unexpectedError: undefined });
        try {
            await action();
        } catch (error) {
            // Anticipated failures are returned as values. Whatever lands here is a defect,
            // and the safe reaction is to show it and do nothing further on our own.
            setState({
                unexpectedError: error instanceof Error ? error.message : 'Unknown error',
            });
        } finally {
            setState({ activity: undefined, isConfirmationOnDeviceRequested: false });
        }
    };

    const handleDeviceLost = (reason: DeviceLostReason) => {
        // A pending PIN prompt must not survive: nothing may be sent to the device any more.
        resolvePin?.(undefined);
        resolvePin = undefined;
        activePassphrase = undefined;
        passphraseCandidates = undefined;
        setState({ deviceLostReason: reason, isPinRequested: false });
    };

    // A call can learn about the loss before the bridge event arrives. Both paths end here.
    const reportIfDeviceLost = (error: { type: string }) => {
        if (isDeviceLostError(error) && !state.deviceLostReason) handleDeviceLost(error.reason);
    };

    const runPreflight: MigrationController['runPreflight'] = () =>
        runExclusive('Checking your computer', async () => {
            setState({ step: 'preflight', preflightIssue: undefined });

            const environmentIssue = getEnvironmentIssue(deps.getEnvironmentInfo());
            if (environmentIssue) {
                setState({ preflightIssue: { type: environmentIssue } });

                return;
            }

            const permission = await deps.queryLocalNetworkAccess();
            if (permission === 'denied') {
                setState({ preflightIssue: { type: 'permission-denied' } });

                return;
            }

            const connected = await deps.bridge.connect();
            if (!connected.success) {
                setState({ preflightIssue: { ...connected.error, permission } });

                return;
            }

            setState({ step: 'device', deviceIssue: undefined });
        });

    const connectDevice: MigrationController['connectDevice'] = () =>
        runExclusive('Looking for your Trezor', async () => {
            if (session) return;

            // Until a session is established nothing was unlocked or shown on the device, so a
            // device that went away during an earlier attempt does not end the migration.
            setState({ deviceIssue: undefined, deviceLostReason: undefined });

            const found = await deps.bridge.findDevice();
            if (!found.success) {
                setState({
                    step: 'preflight',
                    preflightIssue: { ...found.error, permission: 'unknown' },
                });

                return;
            }

            const selection = found.payload;
            if (selection.type !== 'legacy-trezor-one') {
                setState({
                    deviceIssue: selection.type === 'none' ? { type: 'no-device' } : selection,
                });

                return;
            }

            const acquired = await deps.bridge.acquire({
                descriptor: selection.descriptor,
                onLost: handleDeviceLost,
            });
            if (!acquired.success) {
                setState({ deviceIssue: acquired.error });

                return;
            }

            const device = acquired.payload;
            const newSession = createDeviceSession({
                transportCall: device.transportCall,
                getDeviceLostReason: device.getLostReason,
                requestPin: () =>
                    new Promise(resolve => {
                        resolvePin = resolve;
                        setState({ isPinRequested: true });
                    }),
                requestPassphrase: () => Promise.resolve(activePassphrase),
                onButtonRequest: () => setState({ isConfirmationOnDeviceRequested: true }),
            });

            // Always Initialize, never GetFeatures: old bootloaders do not know the latter,
            // and Initialize also aborts whatever an earlier host left unfinished.
            const features = await newSession.call('Initialize', 'Features');
            const evaluated = features.success
                ? evaluateDeviceFeatures(features.payload.message)
                : features;
            if (!evaluated.success) {
                reportIfDeviceLost(evaluated.error);
                await device.release();
                setState({ deviceIssue: evaluated.error });

                return;
            }

            acquiredDevice = device;
            session = newSession;
            setState({
                device: evaluated.payload,
                step: evaluated.payload.hasPassphraseProtection ? 'passphrase' : 'discovery',
            });
        });

    const discover = async () => {
        const { device } = state;
        if (!session || !device) return;

        setState({ step: 'discovery', discoveryError: undefined, accounts: [] });

        const discovered = await discoverWallet({
            call: session.call,
            backend: deps.backend,
            accountTypes: getDiscoverableAccountTypes(device.firmwareVersion),
            passphraseCandidates,
            setActivePassphrase: passphrase => {
                activePassphrase = passphrase;
            },
            onAccountScanned: account => setState({ accounts: [...state.accounts, account] }),
        });

        if (!discovered.success) {
            reportIfDeviceLost(discovered.error);
            setState({ discoveryError: discovered.error });

            return;
        }

        setState({
            accounts: discovered.payload.accounts,
            walletKind: discovered.payload.walletKind,
        });
    };

    const startDiscovery: MigrationController['startDiscovery'] = () =>
        runExclusive('Searching for your bitcoin', discover);

    const submitPassphrase: MigrationController['submitPassphrase'] = (first, second) =>
        runExclusive('Searching for your bitcoin', async () => {
            const candidates = validatePassphraseEntry({ first, second });
            if (!candidates.success) {
                setState({ passphraseError: candidates.error });

                return;
            }

            passphraseCandidates = candidates.payload;
            setState({ passphraseError: undefined });
            await discover();
        });

    const scanMoreAccounts: MigrationController['scanMoreAccounts'] = () =>
        runExclusive('Scanning more accounts', async () => {
            const { device } = state;
            if (!session || !device) return;

            setState({ discoveryError: undefined });

            for (const accountType of getDiscoverableAccountTypes(device.firmwareVersion)) {
                const scannedIndexes = state.accounts
                    .filter(({ account }) => account.accountType === accountType)
                    .map(({ account }) => account.accountIndex);

                const scanned = await scanAccountRange({
                    call: session.call,
                    backend: deps.backend,
                    accountType,
                    firstIndex: Math.max(-1, ...scannedIndexes) + 1,
                    count: SCAN_MORE_ACCOUNTS_STEP,
                    stopAtFirstEmpty: false,
                    onAccountScanned: account =>
                        setState({ accounts: [...state.accounts, account] }),
                });

                if (!scanned.success) {
                    reportIfDeviceLost(scanned.error);
                    setState({ discoveryError: scanned.error });

                    return;
                }
            }
        });

    const confirmDiscovery: MigrationController['confirmDiscovery'] = () => {
        if (state.activity === undefined && state.accounts.length > 0) {
            setState({ step: 'destination', destinationError: undefined });
        }
    };

    // Pending transactions signed in this page session are tracked as transfers of their own.
    // Only the remaining ones, such as a transfer from before a reload, count as in flight.
    const countInFlightFromElsewhere = (inFlight: readonly InFlightTransfer[]) =>
        inFlight.filter(
            ({ spentOutpoints }) =>
                !spentOutpoints.every(outpoint => ledger.isOutpointSigned(outpoint)),
        ).length;

    const prepareTransfer = async (account: DiscoveredAccount): Promise<Transfer | undefined> => {
        const { device, destination } = state;
        if (!device || !destination) return undefined;

        transferSequence += 1;
        const base = {
            key: `${getAccountKey(account)}-${transferSequence}`,
            account,
            stage: 'ready' as const,
            leftovers: [],
            followingTransactions: 0,
            inFlightTransactions: 0,
        };

        const prepared = await prepareSweep({
            backend: deps.backend,
            ledger,
            account,
            destination,
            firmwareVersion: device.firmwareVersion,
            getRandomInt: deps.getRandomInt,
        });
        if (!prepared.success) return { ...base, error: prepared.error };

        const { plan, leftovers, followingTransactions, state: accountState } = prepared.payload;

        return {
            ...base,
            plan,
            leftovers,
            followingTransactions,
            inFlightTransactions: countInFlightFromElsewhere(accountState.inFlight),
        };
    };

    const getOwnScripts = (accounts: readonly ScannedAccount[]) =>
        getOutputScripts(
            accounts.flatMap(({ snapshot }) =>
                getAccountAddresses(snapshot.info).map(({ address }) => address),
            ),
        );

    const submitDestination: MigrationController['submitDestination'] = input =>
        runExclusive('Preparing the transfers', async () => {
            const { device, accounts } = state;
            if (!device) return;

            // The format is checked before anything is composed or sent to the device.
            const destination = validateDestination({
                input,
                firmwareVersion: device.firmwareVersion,
                ownScripts: getOwnScripts(accounts),
            });
            if (!destination.success) {
                setState({ destinationError: destination.error });

                return;
            }

            setState({ destination: destination.payload, destinationError: undefined });

            const transfers: Transfer[] = [];
            for (const { account, isEmpty } of accounts) {
                if (isEmpty) continue;

                const transfer = await prepareTransfer(account);
                if (transfer) transfers.push(transfer);
            }

            setState({ step: 'transfers', transfers });
        });

    const replaceWithFreshPlan = async (transfer: Transfer, error: Transfer['error']) => {
        // A plan that reached the device is spent. The next attempt gets a new amount.
        const fresh = await prepareTransfer(transfer.account);

        const replacement: Transfer = fresh
            ? { ...fresh, error: fresh.error ?? error }
            : { ...transfer, stage: 'ready', error };

        setState({
            transfers: state.transfers.map(current =>
                current.key === transfer.key ? replacement : current,
            ),
        });
    };

    const signTransfer: MigrationController['signTransfer'] = key =>
        runExclusive('Signing on your Trezor', async () => {
            const transfer = state.transfers.find(current => current.key === key);
            if (!session || !transfer?.plan || transfer.stage !== 'ready') return;
            if (state.deviceLostReason || state.isDeviceReleased) return;

            updateTransfer(key, { stage: 'signing', error: undefined });

            const signed = await signSweep({
                session,
                backend: deps.backend,
                ledger,
                account: transfer.account,
                plan: transfer.plan,
            });

            if (signed.success) {
                updateTransfer(key, { stage: 'signed', record: signed.payload });

                return;
            }

            reportIfDeviceLost(signed.error);
            if (state.deviceLostReason) {
                updateTransfer(key, { stage: 'ready', error: signed.error });

                return;
            }

            await replaceWithFreshPlan(transfer, signed.error);
        });

    const broadcastTransfer: MigrationController['broadcastTransfer'] = key =>
        runExclusive('Sending the transaction', async () => {
            const transfer = state.transfers.find(current => current.key === key);
            const { record } = transfer ?? {};
            if (!transfer || !record) return;

            const isFirstBroadcast = transfer.stage === 'signed';
            updateTransfer(key, { stage: 'broadcasting', error: undefined });

            // The stored bytes are sent, on the first attempt and on every later one.
            const pushed = await broadcastSweep({ backend: deps.backend, record });
            let status: SweepStatus = 'pending';

            if (!pushed.success) {
                // A failed request does not prove the network lacks the transaction: an answer
                // can get lost, and the retry is then refused as a duplicate. What spends the
                // inputs decides.
                const snapshot = await loadAccountSnapshot({
                    backend: deps.backend,
                    account: transfer.account,
                });
                const networkStatus = snapshot.success
                    ? evaluateSweepStatus({ snapshot: snapshot.payload, record })
                    : undefined;

                if (networkStatus !== 'pending' && networkStatus !== 'confirmed') {
                    updateTransfer(key, {
                        stage: isFirstBroadcast ? 'signed' : 'broadcast',
                        error: { type: 'broadcast-failed', message: pushed.error.message },
                    });

                    return;
                }

                status = networkStatus;
            }

            updateTransfer(key, { stage: 'broadcast', status });

            if (isFirstBroadcast && transfer.followingTransactions > 0) {
                const next = await prepareTransfer(transfer.account);
                if (next) setState({ transfers: [...state.transfers, next] });
            }
        });

    // Tracking only reads from the backend, so it runs alongside whatever else is going on.
    const refreshTransfers: MigrationController['refreshTransfers'] = async () => {
        if (isRefreshingTransfers) return;

        isRefreshingTransfers = true;
        try {
            // One snapshot per account serves all of its transfers.
            const accounts = new Map(
                state.transfers
                    .filter(isTransferUnsettled)
                    .map(({ account }) => [getAccountKey(account), account]),
            );

            for (const [accountKey, account] of accounts) {
                const snapshot = await loadAccountSnapshot({ backend: deps.backend, account });
                if (!snapshot.success) continue;

                const inFlightTransactions = countInFlightFromElsewhere(
                    evaluateAccountState(snapshot.payload).inFlight,
                );

                state.transfers
                    .filter(transfer => getAccountKey(transfer.account) === accountKey)
                    .forEach(({ key, record, stage }) =>
                        updateTransfer(key, {
                            // Transfers from before a page reload have no record. They are
                            // followed through the pending transactions of the account instead.
                            inFlightTransactions,
                            ...(record && stage === 'broadcast'
                                ? {
                                      status: evaluateSweepStatus({
                                          snapshot: snapshot.payload,
                                          record,
                                      }),
                                  }
                                : {}),
                        }),
                    );
            }
        } finally {
            isRefreshingTransfers = false;
        }
    };

    const editDestination: MigrationController['editDestination'] = () => {
        const isAnythingSigned = state.transfers.some(({ stage }) => stage !== 'ready');
        if (state.activity !== undefined || isAnythingSigned) return;

        setState({ step: 'destination', transfers: [], destination: undefined });
    };

    const retryTransfer: MigrationController['retryTransfer'] = key =>
        runExclusive('Preparing the transfer', async () => {
            const transfer = state.transfers.find(current => current.key === key);
            if (transfer?.stage !== 'ready') return;

            const fresh = await prepareTransfer(transfer.account);
            if (!fresh) return;

            setState({
                transfers: state.transfers.map(current => (current.key === key ? fresh : current)),
            });
        });

    const finish: MigrationController['finish'] = () =>
        runExclusive('Locking your Trezor', async () => {
            let isDeviceLocked = false;
            if (session && acquiredDevice && !state.deviceLostReason && !state.isDeviceReleased) {
                const locked = await lockDevice(session.call);
                if (!locked.success) reportIfDeviceLost(locked.error);
                isDeviceLocked = locked.success;

                await acquiredDevice.release();
            }

            activePassphrase = undefined;
            passphraseCandidates = undefined;
            session = undefined;
            acquiredDevice = undefined;

            // A signed transaction that was not sent yet exists only on the transfers screen.
            // Locking the device is always possible, leaving that screen is not.
            const hasUnsentTransaction = state.transfers.some(({ stage }) => stage === 'signed');
            setState({
                step: hasUnsentTransaction ? state.step : 'summary',
                isDeviceReleased: true,
                isDeviceLocked: state.isDeviceLocked || isDeviceLocked,
            });
        });

    const answerPin = (pin: string | undefined) => {
        resolvePin?.(pin);
        resolvePin = undefined;
        setState({ isPinRequested: false });
    };

    return {
        getState: () => state,
        subscribe: listener => {
            listeners.add(listener);

            return () => {
                listeners.delete(listener);
            };
        },
        runPreflight,
        connectDevice,
        submitPassphrase,
        startDiscovery,
        scanMoreAccounts,
        confirmDiscovery,
        submitDestination,
        editDestination,
        retryTransfer,
        signTransfer,
        broadcastTransfer,
        refreshTransfers,
        finish,
        submitPin: pin => answerPin(pin),
        cancelPin: () => answerPin(undefined),
        releaseOnUnload: () => {
            if (!state.isDeviceReleased) acquiredDevice?.releaseOnUnload();
        },
    };
};
