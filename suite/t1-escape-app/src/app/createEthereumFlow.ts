import { diagnosticLog } from './diagnosticLog';
import {
    type EthereumMigrationState,
    type EthereumTransfer,
    INITIAL_ETHEREUM_MIGRATION_STATE,
    type MigrationState,
    isEthereumChain,
    isEthereumTransferUnsettled,
} from './migrationState';
import type { Backend, EthereumBackend } from '../backend/backend';
import type { DeviceSession } from '../device/deviceSession';
import type { PassphraseCandidates } from '../device/passphrase';
import {
    type EthereumScannedAddress,
    SCAN_MORE_ETHEREUM_ADDRESSES_STEP,
    scanEthereumAddressRange,
} from '../discovery/discoverEthereumAddresses';
import { discoverEthereumWallet } from '../discovery/discoverEthereumWallet';
import { type EthereumAccount, describeEthereumAccount } from '../ethereum/ethereumAccount';
import { ETHEREUM_CHAIN_DEFINITIONS, type EthereumChain } from '../ethereum/ethereumChain';
import { validateEthereumDestination } from '../ethereum/ethereumDestination';
import { createEthereumSweepLedger } from '../migration/ethereumSweepLedger';
import {
    type EthereumSweepStatus,
    broadcastEthereumSweep,
    loadEthereumSweepStatus,
} from '../migration/ethereumSweepStatus';
import { prepareEthereumSweep } from '../migration/prepareEthereumSweep';
import { signEthereumSweep } from '../migration/signEthereumSweep';

/** What the Ethereum flow borrows from the controller that owns the device and the state. */
export type EthereumFlowContext = {
    backend: Backend;
    getMigrationState: () => MigrationState;
    setState: (patch: Partial<MigrationState>) => void;
    /** Runs one action at a time, with the activity shown on screen and defects caught. */
    runExclusive: (activity: string, action: () => Promise<void>) => Promise<void>;
    getSession: () => DeviceSession | undefined;
    getPassphraseCandidates: () => PassphraseCandidates | undefined;
    setActivePassphrase: (passphrase: string) => void;
    reportIfDeviceLost: (error: { type: string }) => void;
};

export type EthereumFlow = {
    /** Runs the discovery of the chosen chain. Expects the chain to be chosen already. */
    discover: () => Promise<void>;
    startDiscovery: () => Promise<void>;
    scanMoreAddresses: () => Promise<void>;
    confirmDiscovery: () => void;
    submitDestination: (input: string) => Promise<void>;
    /** Returns to the address entry. Possible only while nothing has been signed. */
    editDestination: () => void;
    /** Composes a transfer again after its preparation failed or was rejected on the device. */
    retryTransfer: (key: string) => Promise<void>;
    signTransfer: (key: string) => Promise<void>;
    broadcastTransfer: (key: string) => Promise<void>;
    /** Refreshes every transfer that is still open. Only reads from the backend. */
    refreshTransfers: () => Promise<void>;
    hasUnsentTransaction: () => boolean;
};

const getTransferKey = (account: EthereumAccount, sequence: number) =>
    `${account.chain}-${account.slip44}-${account.index}-${sequence}`;

/** Statuses that prove the network has the transaction, whatever the broadcast answered. */
const isOnNetwork = (status: EthereumSweepStatus) =>
    status === 'pending' || status === 'confirmed' || status === 'failed';

/** Addresses worth a transfer: a balance to move, or a pending transaction that may bring one. */
const holdsSomething = ({ info }: EthereumScannedAddress) =>
    info.balance !== '0' || info.unconfirmedTransactions > 0;

/**
 * The Ethereum and Ethereum Classic half of the migration: discovery by address, one transfer
 * per address, signing with the legacy messages and tracking by transaction id. It keeps its own
 * ledger and its own slice of the state; the device session, the passphrase and the screens'
 * busy state are the controller's.
 */
export const createEthereumFlow = (context: EthereumFlowContext): EthereumFlow => {
    const { getMigrationState, setState, runExclusive, reportIfDeviceLost } = context;
    const ledger = createEthereumSweepLedger();
    let transferSequence = 0;
    let isRefreshing = false;

    const getChain = (): EthereumChain | undefined => {
        const { coin } = getMigrationState();

        return isEthereumChain(coin) ? coin : undefined;
    };

    const getChainBackend = (chain: EthereumChain): EthereumBackend =>
        context.backend.ethereum[chain];

    const setEthereumState = (patch: Partial<EthereumMigrationState>) =>
        setState({ ethereum: { ...getMigrationState().ethereum, ...patch } });

    const updateTransfer = (key: string, patch: Partial<EthereumTransfer>) =>
        setEthereumState({
            transfers: getMigrationState().ethereum.transfers.map(transfer =>
                transfer.key === key ? { ...transfer, ...patch } : transfer,
            ),
        });

    // Transfers are logged by their position, never by address or amount.
    const describeTransfer = ({
        key,
        account,
        stage,
        status,
        plan,
        leftover,
        isInFlight,
        error,
    }: EthereumTransfer) => ({
        key,
        account: describeEthereumAccount(account),
        stage,
        ...(status ? { status } : {}),
        ...(plan ? { nonce: plan.nonce, gasPrice: plan.gasPrice } : { plan: 'none' }),
        ...(leftover ? { leftover: leftover.reason } : {}),
        isInFlight,
        ...(error ? { error } : {}),
    });

    const discover = async () => {
        const chain = getChain();
        const session = context.getSession();
        if (!session || !chain) return;

        setState({
            step: 'ethereum-discovery',
            ethereum: { ...INITIAL_ETHEREUM_MIGRATION_STATE },
        });

        const discovered = await discoverEthereumWallet({
            call: session.call,
            backend: getChainBackend(chain),
            chain,
            passphraseCandidates: context.getPassphraseCandidates(),
            setActivePassphrase: context.setActivePassphrase,
            onAddressScanned: address =>
                setEthereumState({
                    addresses: [...getMigrationState().ethereum.addresses, address],
                }),
        });

        if (!discovered.success) {
            diagnosticLog.error('discovery', 'failed', discovered.error);
            reportIfDeviceLost(discovered.error);
            setEthereumState({ discoveryError: discovered.error });

            return;
        }

        const { addresses, walletKind } = discovered.payload;
        diagnosticLog.info('discovery', 'done', {
            chain,
            walletKind,
            addresses: addresses.length,
            usedAddresses: addresses.filter(({ isEmpty }) => !isEmpty).length,
            fundedAddresses: addresses.filter(holdsSomething).length,
        });
        setState({ walletKind });
        setEthereumState({ addresses });
    };

    const describeSearch = () => {
        const chain = getChain();

        return `Searching for your ${chain ? ETHEREUM_CHAIN_DEFINITIONS[chain].symbol : 'coins'}`;
    };

    const startDiscovery: EthereumFlow['startDiscovery'] = () =>
        runExclusive(describeSearch(), discover);

    const scanMoreAddresses: EthereumFlow['scanMoreAddresses'] = () =>
        runExclusive('Scanning more addresses', async () => {
            const chain = getChain();
            const session = context.getSession();
            if (!session || !chain) return;

            setEthereumState({ discoveryError: undefined });

            for (const slip44 of ETHEREUM_CHAIN_DEFINITIONS[chain].slip44s) {
                const scannedIndexes = getMigrationState()
                    .ethereum.addresses.filter(({ account }) => account.slip44 === slip44)
                    .map(({ account }) => account.index);

                const scanned = await scanEthereumAddressRange({
                    call: session.call,
                    backend: getChainBackend(chain),
                    chain,
                    slip44,
                    firstIndex: Math.max(-1, ...scannedIndexes) + 1,
                    count: SCAN_MORE_ETHEREUM_ADDRESSES_STEP,
                    stopAtFirstEmpty: false,
                    onAddressScanned: address =>
                        setEthereumState({
                            addresses: [...getMigrationState().ethereum.addresses, address],
                        }),
                });

                if (!scanned.success) {
                    reportIfDeviceLost(scanned.error);
                    setEthereumState({ discoveryError: scanned.error });

                    return;
                }
            }
        });

    const confirmDiscovery: EthereumFlow['confirmDiscovery'] = () => {
        const state = getMigrationState();
        if (state.activity === undefined && state.ethereum.addresses.length > 0) {
            setState({ step: 'ethereum-destination' });
            setEthereumState({ destinationError: undefined });
        }
    };

    const prepareTransfer = async (
        account: EthereumAccount,
    ): Promise<EthereumTransfer | undefined> => {
        const { destination } = getMigrationState().ethereum;
        if (!destination) return undefined;

        transferSequence += 1;
        const base = {
            key: getTransferKey(account, transferSequence),
            account,
            stage: 'ready' as const,
            isInFlight: false,
        };

        const prepared = await prepareEthereumSweep({
            backend: getChainBackend(account.chain),
            account,
            destination,
        });
        if (!prepared.success) {
            diagnosticLog.error('transfer', 'not prepared', {
                account: describeEthereumAccount(account),
                error: prepared.error,
            });

            return { ...base, error: prepared.error };
        }

        const { plan, leftover, isInFlight } = prepared.payload;
        const transfer: EthereumTransfer = { ...base, plan, leftover, isInFlight };
        diagnosticLog.info('transfer', 'prepared', describeTransfer(transfer));

        return transfer;
    };

    const submitDestination: EthereumFlow['submitDestination'] = input =>
        runExclusive('Preparing the transfers', async () => {
            const { addresses } = getMigrationState().ethereum;

            const destination = validateEthereumDestination({
                input,
                ownAddresses: new Set(
                    addresses.map(({ account }) => account.address.toLowerCase()),
                ),
            });
            if (!destination.success) {
                diagnosticLog.warn('flow', 'destination refused', destination.error);
                setEthereumState({ destinationError: destination.error });

                return;
            }

            // The address itself stays out of the log.
            diagnosticLog.info('flow', 'destination accepted');
            setEthereumState({ destination: destination.payload, destinationError: undefined });

            const transfers: EthereumTransfer[] = [];
            for (const { account } of addresses.filter(holdsSomething)) {
                const transfer = await prepareTransfer(account);
                if (transfer) transfers.push(transfer);
            }

            setState({ step: 'ethereum-transfers' });
            setEthereumState({ transfers });
        });

    const editDestination: EthereumFlow['editDestination'] = () => {
        const state = getMigrationState();
        const isAnythingSigned = state.ethereum.transfers.some(({ stage }) => stage !== 'ready');
        if (state.activity !== undefined || isAnythingSigned) return;

        setState({ step: 'ethereum-destination' });
        setEthereumState({ transfers: [], destination: undefined });
    };

    const replaceTransfer = (key: string, replacement: EthereumTransfer) =>
        setEthereumState({
            transfers: getMigrationState().ethereum.transfers.map(current =>
                current.key === key ? replacement : current,
            ),
        });

    const replaceWithFreshPlan = async (
        transfer: EthereumTransfer,
        error: EthereumTransfer['error'],
    ) => {
        // A plan that reached the device is spent. The next attempt gets a fresh nonce and fee.
        const fresh = await prepareTransfer(transfer.account);

        replaceTransfer(
            transfer.key,
            fresh
                ? { ...fresh, error: fresh.error ?? error }
                : { ...transfer, stage: 'ready', error },
        );
    };

    const retryTransfer: EthereumFlow['retryTransfer'] = key =>
        runExclusive('Preparing the transfer', async () => {
            const transfer = getMigrationState().ethereum.transfers.find(
                current => current.key === key,
            );
            if (transfer?.stage !== 'ready') return;

            const fresh = await prepareTransfer(transfer.account);
            if (fresh) replaceTransfer(key, fresh);
        });

    const signTransfer: EthereumFlow['signTransfer'] = key =>
        runExclusive('Signing on your Trezor', async () => {
            const state = getMigrationState();
            const session = context.getSession();
            const transfer = state.ethereum.transfers.find(current => current.key === key);
            if (!session || !transfer?.plan || transfer.stage !== 'ready') return;
            if (state.deviceLostReason || state.isDeviceReleased) return;

            updateTransfer(key, { stage: 'signing', error: undefined });

            const signed = await signEthereumSweep({
                session,
                backend: getChainBackend(transfer.account.chain),
                ledger,
                plan: transfer.plan,
            });

            if (signed.success) {
                diagnosticLog.info('transfer', 'signed', {
                    key,
                    bytes: (signed.payload.hex.length - 2) / 2,
                });
                updateTransfer(key, { stage: 'signed', record: signed.payload });

                return;
            }

            diagnosticLog.error('transfer', 'signing failed', { key, error: signed.error });
            reportIfDeviceLost(signed.error);
            if (getMigrationState().deviceLostReason) {
                updateTransfer(key, { stage: 'ready', error: signed.error });

                return;
            }

            await replaceWithFreshPlan(transfer, signed.error);
        });

    const broadcastTransfer: EthereumFlow['broadcastTransfer'] = key =>
        runExclusive('Sending the transaction', async () => {
            const transfer = getMigrationState().ethereum.transfers.find(
                current => current.key === key,
            );
            const { record } = transfer ?? {};
            if (!transfer || !record) return;

            const backend = getChainBackend(transfer.account.chain);
            const isFirstBroadcast = transfer.stage === 'signed';
            diagnosticLog.info('transfer', 'broadcast', { key, isFirstBroadcast });
            updateTransfer(key, { stage: 'broadcasting', error: undefined });

            // The stored bytes are sent, on the first attempt and on every later one.
            const pushed = await broadcastEthereumSweep({ backend, record });
            let status: EthereumSweepStatus = 'pending';

            if (!pushed.success) {
                // A failed request does not prove the network lacks the transaction: an answer
                // can get lost, and the retry is then refused as a duplicate. The backend's own
                // view of the transaction decides.
                const loaded = await loadEthereumSweepStatus({ backend, record });
                const networkStatus = loaded.success ? loaded.payload : undefined;

                diagnosticLog.warn('transfer', 'broadcast failed', {
                    key,
                    message: pushed.error.message,
                    networkStatus,
                });
                if (!networkStatus || !isOnNetwork(networkStatus)) {
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
        });

    const refreshTransfers: EthereumFlow['refreshTransfers'] = async () => {
        if (isRefreshing) return;

        isRefreshing = true;
        try {
            const unsettled = getMigrationState().ethereum.transfers.filter(
                isEthereumTransferUnsettled,
            );

            for (const transfer of unsettled) {
                const { key, record, stage, account } = transfer;

                if (record && stage === 'broadcast') {
                    const loaded = await loadEthereumSweepStatus({
                        backend: getChainBackend(account.chain),
                        record,
                    });
                    if (!loaded.success) continue;

                    diagnosticLog.info('transfer', 'refreshed', { key, status: loaded.payload });
                    updateTransfer(key, { status: loaded.payload });
                } else if (transfer.isInFlight) {
                    // Once the pending transaction settles, the address can be composed. The
                    // key stays, so that the screen keeps showing the same card.
                    const fresh = await prepareTransfer(account);
                    if (!fresh) continue;

                    diagnosticLog.info('transfer', 'refreshed', describeTransfer(fresh));
                    replaceTransfer(key, { ...fresh, key });
                }
            }
        } finally {
            isRefreshing = false;
        }
    };

    return {
        discover,
        startDiscovery,
        scanMoreAddresses,
        confirmDiscovery,
        submitDestination,
        editDestination,
        retryTransfer,
        signTransfer,
        broadcastTransfer,
        refreshTransfers,
        hasUnsentTransaction: () =>
            getMigrationState().ethereum.transfers.some(({ stage }) => stage === 'signed'),
    };
};
