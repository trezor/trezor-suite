import { diagnosticLog } from './diagnosticLog';
import {
    type EthereumChainState,
    type EthereumTransfer,
    type MigrationState,
    getEthereumTransfers,
    holdsEthereum,
    isEthereumTransferUnsettled,
} from './migrationState';
import type { Backend, EthereumBackend } from '../backend/backend';
import type { DeviceSession } from '../device/deviceSession';
import {
    SCAN_MORE_ETHEREUM_ADDRESSES_STEP,
    scanEthereumAddressRange,
} from '../discovery/discoverEthereumAddresses';
import { type EthereumAccount, describeEthereumAccount } from '../ethereum/ethereumAccount';
import { ETHEREUM_CHAIN_DEFINITIONS, type EthereumChain } from '../ethereum/ethereumChain';
import { createEthereumSweepLedger } from '../migration/ethereumSweepLedger';
import {
    type EthereumSweepStatus,
    broadcastEthereumSweep,
    loadEthereumSweepStatus,
} from '../migration/ethereumSweepStatus';
import { prepareEthereumSweep } from '../migration/prepareEthereumSweep';
import { signEthereumSweep } from '../migration/signEthereumSweep';

/** What the Ethereum transfers borrow from the controller that owns the device and the state. */
export type EthereumTransfersContext = {
    backend: Backend;
    getMigrationState: () => MigrationState;
    setState: (patch: Partial<MigrationState>) => void;
    getSession: () => DeviceSession | undefined;
    reportIfDeviceLost: (error: { type: string }) => void;
    /** Shared with the Bitcoin transfers, so that no two transfers of the page share a key. */
    nextTransferSequence: () => number;
};

/**
 * The Ethereum operations of the migration. None of them guards against running alongside
 * another: the controller runs them one at a time, with the activity shown on screen.
 */
export type EthereumTransfers = {
    /** Scans further addresses of every path family of the chain. */
    scanMoreAddresses: (chain: EthereumChain) => Promise<void>;
    /** Composes one transfer per address of the chain that holds something. Needs its destination. */
    prepareTransfers: (chain: EthereumChain) => Promise<EthereumTransfer[]>;
    /** Composes a transfer again after its preparation failed or was rejected on the device. */
    retryTransfer: (key: string) => Promise<void>;
    signTransfer: (key: string) => Promise<void>;
    broadcastTransfer: (key: string) => Promise<void>;
    /** Refreshes every transfer that is still open. Only reads from the backend. */
    refreshTransfers: () => Promise<void>;
};

const getTransferKey = (account: EthereumAccount, sequence: number) =>
    `${account.chain}-${account.slip44}-${account.index}-${sequence}`;

/** Statuses that prove the network has the transaction, whatever the broadcast answered. */
const isOnNetwork = (status: EthereumSweepStatus) =>
    status === 'pending' || status === 'confirmed' || status === 'failed';

/**
 * The Ethereum and Ethereum Classic transfers of the migration: one per address, signed with
 * the legacy messages and tracked by transaction id. One ledger covers both chains, as every
 * plan it records carries its chain id. The device session, the passphrase and the screens'
 * busy state are the controller's.
 */
export const createEthereumTransfers = (context: EthereumTransfersContext): EthereumTransfers => {
    const { getMigrationState, setState, reportIfDeviceLost } = context;
    const ledger = createEthereumSweepLedger();

    const getChainBackend = (chain: EthereumChain): EthereumBackend =>
        context.backend.ethereum[chain];

    const setChainState = (chain: EthereumChain, patch: Partial<EthereumChainState>) => {
        const { ethereum } = getMigrationState();

        setState({ ethereum: { ...ethereum, [chain]: { ...ethereum[chain], ...patch } } });
    };

    const findTransfer = (key: string) =>
        getEthereumTransfers(getMigrationState()).find(transfer => transfer.key === key);

    const replaceTransfer = (
        { key, account }: EthereumTransfer,
        getReplacement: (current: EthereumTransfer) => EthereumTransfer,
    ) =>
        setChainState(account.chain, {
            transfers: getMigrationState().ethereum[account.chain].transfers.map(current =>
                current.key === key ? getReplacement(current) : current,
            ),
        });

    const updateTransfer = (transfer: EthereumTransfer, patch: Partial<EthereumTransfer>) =>
        replaceTransfer(transfer, current => ({ ...current, ...patch }));

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

    const scanMoreAddresses: EthereumTransfers['scanMoreAddresses'] = async chain => {
        const session = context.getSession();
        if (!session) return;

        setChainState(chain, { discoveryError: undefined });

        for (const slip44 of ETHEREUM_CHAIN_DEFINITIONS[chain].slip44s) {
            const scannedIndexes = getMigrationState()
                .ethereum[chain].addresses.filter(({ account }) => account.slip44 === slip44)
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
                    setChainState(chain, {
                        addresses: [...getMigrationState().ethereum[chain].addresses, address],
                    }),
            });

            if (!scanned.success) {
                reportIfDeviceLost(scanned.error);
                setChainState(chain, { discoveryError: scanned.error });

                return;
            }
        }
    };

    const prepareTransfer = async (
        account: EthereumAccount,
    ): Promise<EthereumTransfer | undefined> => {
        const { destination } = getMigrationState().ethereum[account.chain];
        if (!destination) return undefined;

        const base = {
            key: getTransferKey(account, context.nextTransferSequence()),
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

    const prepareTransfers: EthereumTransfers['prepareTransfers'] = async chain => {
        const { addresses } = getMigrationState().ethereum[chain];

        const transfers: EthereumTransfer[] = [];
        for (const { account } of addresses.filter(holdsEthereum)) {
            const transfer = await prepareTransfer(account);
            if (transfer) transfers.push(transfer);
        }

        return transfers;
    };

    const replaceWithFreshPlan = async (
        transfer: EthereumTransfer,
        error: EthereumTransfer['error'],
    ) => {
        // A plan that reached the device is spent. The next attempt gets a fresh nonce and fee.
        const fresh = await prepareTransfer(transfer.account);

        replaceTransfer(transfer, current =>
            fresh
                ? { ...fresh, error: fresh.error ?? error }
                : { ...current, stage: 'ready', error },
        );
    };

    const retryTransfer: EthereumTransfers['retryTransfer'] = async key => {
        const transfer = findTransfer(key);
        if (transfer?.stage !== 'ready') return;

        const fresh = await prepareTransfer(transfer.account);
        if (fresh) replaceTransfer(transfer, () => fresh);
    };

    const signTransfer: EthereumTransfers['signTransfer'] = async key => {
        const state = getMigrationState();
        const session = context.getSession();
        const transfer = findTransfer(key);
        if (!session || !transfer?.plan || transfer.stage !== 'ready') return;
        if (state.deviceLostReason || state.isDeviceReleased) return;

        updateTransfer(transfer, { stage: 'signing', error: undefined });

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
            updateTransfer(transfer, { stage: 'signed', record: signed.payload });

            return;
        }

        diagnosticLog.error('transfer', 'signing failed', { key, error: signed.error });
        reportIfDeviceLost(signed.error);
        if (getMigrationState().deviceLostReason) {
            updateTransfer(transfer, { stage: 'ready', error: signed.error });

            return;
        }

        await replaceWithFreshPlan(transfer, signed.error);
    };

    const broadcastTransfer: EthereumTransfers['broadcastTransfer'] = async key => {
        const transfer = findTransfer(key);
        const { record } = transfer ?? {};
        if (!transfer || !record) return;

        const backend = getChainBackend(transfer.account.chain);
        const isFirstBroadcast = transfer.stage === 'signed';
        diagnosticLog.info('transfer', 'broadcast', { key, isFirstBroadcast });
        updateTransfer(transfer, { stage: 'broadcasting', error: undefined });

        // The stored bytes are sent, on the first attempt and on every later one.
        const pushed = await broadcastEthereumSweep({ backend, record });
        let status: EthereumSweepStatus = 'pending';

        if (!pushed.success) {
            // A failed request does not prove the network lacks the transaction: an answer can
            // get lost, and the retry is then refused as a duplicate. The backend's own view of
            // the transaction decides.
            const loaded = await loadEthereumSweepStatus({ backend, record });
            const networkStatus = loaded.success ? loaded.payload : undefined;

            diagnosticLog.warn('transfer', 'broadcast failed', {
                key,
                message: pushed.error.message,
                networkStatus,
            });
            if (!networkStatus || !isOnNetwork(networkStatus)) {
                updateTransfer(transfer, {
                    stage: isFirstBroadcast ? 'signed' : 'broadcast',
                    error: { type: 'broadcast-failed', message: pushed.error.message },
                });

                return;
            }

            status = networkStatus;
        }

        diagnosticLog.info('transfer', 'on the network', { key, status });
        updateTransfer(transfer, { stage: 'broadcast', status });
    };

    const refreshTransfers: EthereumTransfers['refreshTransfers'] = async () => {
        const unsettled = getEthereumTransfers(getMigrationState()).filter(
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
                updateTransfer(transfer, { status: loaded.payload });
            } else if (transfer.isInFlight) {
                // Once the pending transaction settles, the address can be composed. The key
                // stays, so that the screen keeps showing the same card.
                const fresh = await prepareTransfer(account);
                if (!fresh) continue;

                diagnosticLog.info('transfer', 'refreshed', describeTransfer(fresh));
                replaceTransfer(transfer, () => ({ ...fresh, key }));
            }
        }
    };

    return {
        scanMoreAddresses,
        prepareTransfers,
        retryTransfer,
        signTransfer,
        broadcastTransfer,
        refreshTransfers,
    };
};
