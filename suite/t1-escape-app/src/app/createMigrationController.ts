import { describeError, diagnosticLog } from './diagnosticLog';
import { createEthereumTransfers } from './ethereumTransfers';
import {
    type BitcoinState,
    type Coin,
    type DestinationInputs,
    type EthereumTransfer,
    INITIAL_BITCOIN_STATE,
    INITIAL_ETHEREUM_CHAIN_STATE,
    INITIAL_MIGRATION_STATE,
    type MigrationState,
    type Transfer,
    getCoinsToMove,
    hasUnsentTransaction,
    isAnythingSigned,
    isTransferUnsettled,
    mapEthereumChains,
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
import { type EthereumChainScan, discoverWallet } from '../discovery/discoverWallet';
import { ETHEREUM_CHAINS, type EthereumChain } from '../ethereum/ethereumChain';
import { validateEthereumDestination } from '../ethereum/ethereumDestination';
import { getDiscoverableAccountTypes, isEthereumSupported } from '../firmware/firmwareSupport';
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
    /** Scans every coin the firmware can sign for, on one device session. */
    startDiscovery: () => Promise<void>;
    scanMoreAccounts: () => Promise<void>;
    scanMoreAddresses: (chain: EthereumChain) => Promise<void>;
    confirmDiscovery: () => void;
    /** Checks every address first; nothing is composed until all of them are accepted. */
    submitDestinations: (inputs: DestinationInputs) => Promise<void>;
    /** Returns to the address entry. Possible only while nothing has been signed. */
    editDestinations: () => void;
    /** Composes a transfer of any coin again after its preparation failed. */
    retryTransfer: (key: string) => Promise<void>;
    signTransfer: (key: string) => Promise<void>;
    broadcastTransfer: (key: string) => Promise<void>;
    /** Follows the open transfers of every coin on the network. */
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

const toChainState = ({ addresses, error }: EthereumChainScan) => ({
    ...INITIAL_ETHEREUM_CHAIN_STATE,
    addresses,
    discoveryError: error,
});

/**
 * Runs the migration from the first screen to the last. It owns everything that lives only
 * in memory for the duration of the page: the device session, the passphrase, the ledgers of
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
        if (patch.step !== undefined && patch.step !== state.step) {
            diagnosticLog.info('flow', `step ${state.step} -> ${patch.step}`);
        }
        state = { ...state, ...patch };
        listeners.forEach(listener => listener());
    };

    const setBitcoinState = (patch: Partial<BitcoinState>) =>
        setState({ bitcoin: { ...state.bitcoin, ...patch } });

    // Transfers are logged by their position, never by address or amount.
    const describeTransfer = ({
        key,
        account,
        plan,
        stage,
        status,
        error,
        leftovers,
    }: Transfer) => ({
        key,
        account: `${account.accountType} #${account.accountIndex}`,
        stage,
        ...(status ? { status } : {}),
        ...(plan
            ? { inputs: plan.inputs.length, virtualSize: plan.virtualSize, fee: plan.fee }
            : { plan: 'none' }),
        leftovers: leftovers.length,
        ...(error ? { error } : {}),
    });

    const updateTransfer = (key: string, patch: Partial<Transfer>) =>
        setBitcoinState({
            transfers: state.bitcoin.transfers.map(transfer =>
                transfer.key === key ? { ...transfer, ...patch } : transfer,
            ),
        });

    const findBitcoinTransfer = (key: string) =>
        state.bitcoin.transfers.find(transfer => transfer.key === key);

    // Only one action runs at a time. The device and the ledgers are not built for more.
    const runExclusive = async (activity: string, action: () => Promise<void>) => {
        if (state.activity !== undefined) return;

        diagnosticLog.info('flow', activity);
        setState({ activity, unexpectedError: undefined });
        try {
            await action();
        } catch (error) {
            // Anticipated failures are returned as values. Whatever lands here is a defect,
            // and the safe reaction is to show it and do nothing further on our own.
            diagnosticLog.error('flow', `${activity}: unexpected error`, describeError(error));
            setState({
                unexpectedError: error instanceof Error ? error.message : 'Unknown error',
            });
        } finally {
            setState({ activity: undefined, isConfirmationOnDeviceRequested: false });
        }
    };

    const handleDeviceLost = (reason: DeviceLostReason) => {
        diagnosticLog.error('flow', 'device lost, the migration stops', { reason });
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

    const ethereum = createEthereumTransfers({
        backend: deps.backend,
        getMigrationState: () => state,
        setState,
        getSession: () => session,
        reportIfDeviceLost,
        nextTransferSequence: () => {
            transferSequence += 1;

            return transferSequence;
        },
    });

    const runPreflight: MigrationController['runPreflight'] = () =>
        runExclusive('Checking your computer', async () => {
            setState({ step: 'preflight', preflightIssue: undefined });

            const environment = deps.getEnvironmentInfo();
            diagnosticLog.info('preflight', 'environment', environment);
            const environmentIssue = getEnvironmentIssue(environment);
            if (environmentIssue) {
                diagnosticLog.error('preflight', 'unsupported environment', {
                    issue: environmentIssue,
                });
                setState({ preflightIssue: { type: environmentIssue } });

                return;
            }

            const permission = await deps.queryLocalNetworkAccess();
            diagnosticLog.info('preflight', 'local network access permission', { permission });
            if (permission === 'denied') {
                setState({ preflightIssue: { type: 'permission-denied' } });

                return;
            }

            const connected = await deps.bridge.connect();
            if (!connected.success) {
                diagnosticLog.error('preflight', 'bridge not usable', connected.error);
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
                diagnosticLog.warn('flow', 'no usable device', { selection: selection.type });
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
                diagnosticLog.error('flow', 'device not acquired', acquired.error);
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
            if (features.success) {
                // Label and device id are left out, they identify the device.
                const { message } = features.payload;
                diagnosticLog.info('device', 'Features', {
                    vendor: message.vendor,
                    firmware: `${message.major_version}.${message.minor_version}.${message.patch_version}`,
                    model: message.model,
                    bootloaderMode: message.bootloader_mode,
                    initialized: message.initialized,
                    pinProtection: message.pin_protection,
                    passphraseProtection: message.passphrase_protection,
                    capabilities: message.capabilities?.length,
                });
            }
            const evaluated = features.success
                ? evaluateDeviceFeatures(features.payload.message)
                : features;
            if (!evaluated.success) {
                diagnosticLog.error('flow', 'device refused', evaluated.error);
                reportIfDeviceLost(evaluated.error);
                await device.release();
                setState({ deviceIssue: evaluated.error });

                return;
            }

            diagnosticLog.info('flow', 'device accepted', {
                ...evaluated.payload,
                ethereumSupported: isEthereumSupported(evaluated.payload.firmwareVersion),
            });

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

        setState({
            step: 'discovery',
            discoveryError: undefined,
            walletKind: undefined,
            bitcoin: INITIAL_BITCOIN_STATE,
            ethereum: mapEthereumChains(() => INITIAL_ETHEREUM_CHAIN_STATE),
        });

        const discovered = await discoverWallet({
            call: session.call,
            backend: deps.backend,
            accountTypes: getDiscoverableAccountTypes(device.firmwareVersion),
            ethereumChains: isEthereumSupported(device.firmwareVersion) ? ETHEREUM_CHAINS : [],
            passphraseCandidates,
            setActivePassphrase: passphrase => {
                activePassphrase = passphrase;
            },
            onAccountScanned: account =>
                setBitcoinState({ accounts: [...state.bitcoin.accounts, account] }),
            onAddressScanned: address => {
                const { chain } = address.account;

                setState({
                    ethereum: {
                        ...state.ethereum,
                        [chain]: {
                            ...state.ethereum[chain],
                            addresses: [...state.ethereum[chain].addresses, address],
                        },
                    },
                });
            },
        });

        if (!discovered.success) {
            diagnosticLog.error('discovery', 'stopped', discovered.error);
            reportIfDeviceLost(discovered.error);
            setState({ discoveryError: discovered.error });

            return;
        }

        const { walletKind, accounts, bitcoinError, ethereum: chains } = discovered.payload;
        diagnosticLog.info('discovery', 'done', {
            walletKind,
            accounts: accounts.length,
            addresses: ETHEREUM_CHAINS.map(chain => chains[chain].addresses.length),
            failedCoins: [
                ...(bitcoinError ? ['bitcoin'] : []),
                ...ETHEREUM_CHAINS.filter(chain => chains[chain].error),
            ],
        });
        setState({
            walletKind,
            bitcoin: { ...INITIAL_BITCOIN_STATE, accounts, discoveryError: bitcoinError },
            ethereum: mapEthereumChains(chain => toChainState(chains[chain])),
        });
    };

    const startDiscovery: MigrationController['startDiscovery'] = () =>
        runExclusive('Searching for your coins', discover);

    const submitPassphrase: MigrationController['submitPassphrase'] = (first, second) =>
        runExclusive('Searching for your coins', async () => {
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

            setBitcoinState({ discoveryError: undefined });

            for (const accountType of getDiscoverableAccountTypes(device.firmwareVersion)) {
                const scannedIndexes = state.bitcoin.accounts
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
                        setBitcoinState({ accounts: [...state.bitcoin.accounts, account] }),
                });

                if (!scanned.success) {
                    reportIfDeviceLost(scanned.error);
                    setBitcoinState({ discoveryError: scanned.error });

                    return;
                }
            }
        });

    const scanMoreAddresses: MigrationController['scanMoreAddresses'] = chain =>
        runExclusive('Scanning more addresses', () => ethereum.scanMoreAddresses(chain));

    const confirmDiscovery: MigrationController['confirmDiscovery'] = () => {
        const isDiscovered = state.walletKind !== undefined && !state.discoveryError;
        if (state.activity !== undefined || !isDiscovered) return;
        if (getCoinsToMove(state).length === 0) return;

        setState({
            step: 'destination',
            bitcoin: { ...state.bitcoin, destinationError: undefined },
            ethereum: mapEthereumChains(chain => ({
                ...state.ethereum[chain],
                destinationError: undefined,
            })),
        });
    };

    // Pending transactions signed in this page session are tracked as transfers of their own.
    // Only the remaining ones, such as a transfer from before a reload, count as in flight.
    const countInFlightFromElsewhere = (inFlight: readonly InFlightTransfer[]) =>
        inFlight.filter(
            ({ spentOutpoints }) =>
                !spentOutpoints.every(outpoint => ledger.isOutpointSigned(outpoint)),
        ).length;

    const prepareTransfer = async (account: DiscoveredAccount): Promise<Transfer | undefined> => {
        const { device } = state;
        const { destination } = state.bitcoin;
        if (!device || !destination) return undefined;

        transferSequence += 1;
        const base = {
            key: `bitcoin-${getAccountKey(account)}-${transferSequence}`,
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
        if (!prepared.success) {
            diagnosticLog.error('transfer', 'not prepared', {
                account: `${account.accountType} #${account.accountIndex}`,
                error: prepared.error,
            });

            return { ...base, error: prepared.error };
        }

        const { plan, leftovers, followingTransactions, state: accountState } = prepared.payload;
        const transfer: Transfer = {
            ...base,
            plan,
            leftovers,
            followingTransactions,
            inFlightTransactions: countInFlightFromElsewhere(accountState.inFlight),
        };
        diagnosticLog.info('transfer', 'prepared', {
            ...describeTransfer(transfer),
            followingTransactions,
            inFlightTransactions: transfer.inFlightTransactions,
            spendable: accountState.spendable.length,
            unconfirmed: accountState.unconfirmed.length,
            leftoverReasons: leftovers.map(({ reason }) => reason),
        });

        return transfer;
    };

    const prepareBitcoinTransfers = async () => {
        const transfers: Transfer[] = [];
        for (const { account, isEmpty } of state.bitcoin.accounts) {
            if (isEmpty) continue;

            const transfer = await prepareTransfer(account);
            if (transfer) transfers.push(transfer);
        }

        return transfers;
    };

    const getOwnScripts = (accounts: readonly ScannedAccount[]) =>
        getOutputScripts(
            accounts.flatMap(({ snapshot }) =>
                getAccountAddresses(snapshot.info).map(({ address }) => address),
            ),
        );

    // The `m/44'/60'` keys are shared by both chains, so an address scanned for one of them
    // belongs to the old wallet on the other one as well.
    const getOwnEthereumAddresses = () =>
        new Set(
            ETHEREUM_CHAINS.flatMap(chain =>
                state.ethereum[chain].addresses.map(({ account }) => account.address.toLowerCase()),
            ),
        );

    const submitDestinations: MigrationController['submitDestinations'] = inputs =>
        runExclusive('Preparing the transfers', async () => {
            const { device } = state;
            if (!device) return;

            // Every address is checked before anything is composed or sent to the device, so
            // that all mistakes show at once and no coin is prepared on a half-filled form.
            const coins = getCoinsToMove(state);
            const bitcoin = coins.includes('bitcoin')
                ? validateDestination({
                      input: inputs.bitcoin ?? '',
                      firmwareVersion: device.firmwareVersion,
                      ownScripts: getOwnScripts(state.bitcoin.accounts),
                  })
                : undefined;
            const ownAddresses = getOwnEthereumAddresses();
            const chains = mapEthereumChains(chain =>
                coins.includes(chain)
                    ? validateEthereumDestination({ input: inputs[chain] ?? '', ownAddresses })
                    : undefined,
            );

            const refusedCoins: Coin[] = [
                ...(bitcoin && !bitcoin.success ? (['bitcoin'] as const) : []),
                ...ETHEREUM_CHAINS.filter(chain => chains[chain]?.success === false),
            ];
            if (refusedCoins.length > 0) {
                diagnosticLog.warn('flow', 'destinations refused', {
                    coins: refusedCoins,
                    ...(bitcoin && !bitcoin.success ? { bitcoin: bitcoin.error } : {}),
                });
                setState({
                    bitcoin: {
                        ...state.bitcoin,
                        destinationError: bitcoin && !bitcoin.success ? bitcoin.error : undefined,
                    },
                    ethereum: mapEthereumChains(chain => {
                        const validated = chains[chain];

                        return {
                            ...state.ethereum[chain],
                            destinationError:
                                validated && !validated.success ? validated.error : undefined,
                        };
                    }),
                });

                return;
            }

            // The addresses themselves stay out of the log.
            diagnosticLog.info('flow', 'destinations accepted', {
                coins,
                ...(bitcoin?.success ? { bitcoinFormat: bitcoin.payload.format } : {}),
            });
            setState({
                bitcoin: {
                    ...state.bitcoin,
                    destination: bitcoin?.success ? bitcoin.payload : undefined,
                    destinationError: undefined,
                },
                ethereum: mapEthereumChains(chain => {
                    const validated = chains[chain];

                    return {
                        ...state.ethereum[chain],
                        destination: validated?.success ? validated.payload : undefined,
                        destinationError: undefined,
                    };
                }),
            });

            const bitcoinTransfers = state.bitcoin.destination
                ? await prepareBitcoinTransfers()
                : [];
            const ethereumTransfers = mapEthereumChains<EthereumTransfer[]>(() => []);
            for (const chain of ETHEREUM_CHAINS) {
                if (state.ethereum[chain].destination) {
                    ethereumTransfers[chain] = await ethereum.prepareTransfers(chain);
                }
            }

            setState({
                step: 'transfers',
                bitcoin: { ...state.bitcoin, transfers: bitcoinTransfers },
                ethereum: mapEthereumChains(chain => ({
                    ...state.ethereum[chain],
                    transfers: ethereumTransfers[chain],
                })),
            });
        });

    const replaceWithFreshPlan = async (transfer: Transfer, error: Transfer['error']) => {
        // A plan that reached the device is spent. The next attempt gets a new amount.
        const fresh = await prepareTransfer(transfer.account);

        const replacement: Transfer = fresh
            ? { ...fresh, error: fresh.error ?? error }
            : { ...transfer, stage: 'ready', error };

        setBitcoinState({
            transfers: state.bitcoin.transfers.map(current =>
                current.key === transfer.key ? replacement : current,
            ),
        });
    };

    const signBitcoinTransfer = async (key: string) => {
        const transfer = findBitcoinTransfer(key);
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
            diagnosticLog.info('transfer', 'signed', {
                key,
                bytes: signed.payload.hex.length / 2,
            });
            updateTransfer(key, { stage: 'signed', record: signed.payload });

            return;
        }

        diagnosticLog.error('transfer', 'signing failed', { key, error: signed.error });
        reportIfDeviceLost(signed.error);
        if (state.deviceLostReason) {
            updateTransfer(key, { stage: 'ready', error: signed.error });

            return;
        }

        await replaceWithFreshPlan(transfer, signed.error);
    };

    const broadcastBitcoinTransfer = async (key: string) => {
        const transfer = findBitcoinTransfer(key);
        const { record } = transfer ?? {};
        if (!transfer || !record) return;

        const isFirstBroadcast = transfer.stage === 'signed';
        diagnosticLog.info('transfer', 'broadcast', { key, isFirstBroadcast });
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

            diagnosticLog.warn('transfer', 'broadcast failed', {
                key,
                message: pushed.error.message,
                networkStatus,
            });
            if (networkStatus !== 'pending' && networkStatus !== 'confirmed') {
                updateTransfer(key, {
                    stage: isFirstBroadcast ? 'signed' : 'broadcast',
                    error: { type: 'broadcast-failed', message: pushed.error.message },
                });

                return;
            }

            status = networkStatus;
        }

        diagnosticLog.info('transfer', 'on the network', { key, status });
        updateTransfer(key, { stage: 'broadcast', status });

        if (isFirstBroadcast && transfer.followingTransactions > 0) {
            const next = await prepareTransfer(transfer.account);
            if (next) setBitcoinState({ transfers: [...state.bitcoin.transfers, next] });
        }
    };

    const retryBitcoinTransfer = async (key: string) => {
        const transfer = findBitcoinTransfer(key);
        if (transfer?.stage !== 'ready') return;

        const fresh = await prepareTransfer(transfer.account);
        if (!fresh) return;

        setBitcoinState({
            transfers: state.bitcoin.transfers.map(current =>
                current.key === key ? fresh : current,
            ),
        });
    };

    // A key names a transfer of exactly one coin. Whichever list holds it handles the action.
    const dispatchByKey =
        (
            activity: string,
            onBitcoin: (key: string) => Promise<void>,
            onEthereum: (key: string) => Promise<void>,
        ): ((key: string) => Promise<void>) =>
        key =>
            runExclusive(activity, () =>
                findBitcoinTransfer(key) ? onBitcoin(key) : onEthereum(key),
            );

    const retryTransfer = dispatchByKey(
        'Preparing the transfer',
        retryBitcoinTransfer,
        ethereum.retryTransfer,
    );

    const signTransfer = dispatchByKey(
        'Signing on your Trezor',
        signBitcoinTransfer,
        ethereum.signTransfer,
    );

    const broadcastTransfer = dispatchByKey(
        'Sending the transaction',
        broadcastBitcoinTransfer,
        ethereum.broadcastTransfer,
    );

    const refreshBitcoinTransfers = async () => {
        // One snapshot per account serves all of its transfers.
        const accounts = new Map(
            state.bitcoin.transfers
                .filter(isTransferUnsettled)
                .map(({ account }) => [getAccountKey(account), account]),
        );

        for (const [accountKey, account] of accounts) {
            const snapshot = await loadAccountSnapshot({ backend: deps.backend, account });
            if (!snapshot.success) continue;

            const inFlightTransactions = countInFlightFromElsewhere(
                evaluateAccountState(snapshot.payload).inFlight,
            );
            const ofAccount = state.bitcoin.transfers.filter(
                transfer => getAccountKey(transfer.account) === accountKey,
            );
            diagnosticLog.info('transfer', 'refreshed', {
                account: accountKey,
                inFlightTransactions,
                statuses: ofAccount.map(({ key, record, stage }) => ({
                    key,
                    status:
                        record && stage === 'broadcast'
                            ? evaluateSweepStatus({ snapshot: snapshot.payload, record })
                            : stage,
                })),
            });

            ofAccount.forEach(({ key, record, stage }) =>
                updateTransfer(key, {
                    // Transfers from before a page reload have no record. They are followed
                    // through the pending transactions of the account instead.
                    inFlightTransactions,
                    ...(record && stage === 'broadcast'
                        ? { status: evaluateSweepStatus({ snapshot: snapshot.payload, record }) }
                        : {}),
                }),
            );
        }
    };

    // Tracking only reads from the backend, so it runs alongside whatever else is going on.
    const refreshTransfers: MigrationController['refreshTransfers'] = async () => {
        if (isRefreshingTransfers) return;

        isRefreshingTransfers = true;
        try {
            await refreshBitcoinTransfers();
            await ethereum.refreshTransfers();
        } finally {
            isRefreshingTransfers = false;
        }
    };

    const editDestinations: MigrationController['editDestinations'] = () => {
        if (state.activity !== undefined || isAnythingSigned(state)) return;

        setState({
            step: 'destination',
            bitcoin: { ...state.bitcoin, transfers: [], destination: undefined },
            ethereum: mapEthereumChains(chain => ({
                ...state.ethereum[chain],
                transfers: [],
                destination: undefined,
            })),
        });
    };

    const finish: MigrationController['finish'] = () =>
        runExclusive('Locking your Trezor', async () => {
            let isDeviceLocked = false;
            if (session && acquiredDevice && !state.deviceLostReason && !state.isDeviceReleased) {
                const locked = await lockDevice(session.call);
                if (locked.success) {
                    diagnosticLog.info('flow', 'device locked');
                } else {
                    diagnosticLog.error('flow', 'device not locked', locked.error);
                    reportIfDeviceLost(locked.error);
                }
                isDeviceLocked = locked.success;

                await acquiredDevice.release();
            }

            activePassphrase = undefined;
            passphraseCandidates = undefined;
            session = undefined;
            acquiredDevice = undefined;

            // Locking the device is always possible, leaving the transfers screen is not while
            // a signed transaction of any coin exists only there.
            setState({
                step: hasUnsentTransaction(state) ? state.step : 'summary',
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
        scanMoreAddresses,
        confirmDiscovery,
        submitDestinations,
        editDestinations,
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
