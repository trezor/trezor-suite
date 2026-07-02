// Monero blockchain backend worker.
//
// Talks to a local `monerod` (managed by the desktop app, see suite-desktop-core) and does
// CLIENT-SIDE view-key scanning via monero-ts (wallet2 compiled to WASM) — the monero-gui model.
// The private view key arrives per request in `payload.monero` (an in-process secret channel)
// and is used only to build an in-memory view-only wallet; it is never echoed back, logged or
// persisted (CLAUDE.md confidential data).
//
// The wallet runs with `proxyToWorker: true` so its (heavy, full-chain) view-key scan happens on
// monero-ts' own worker thread and never blocks this process. The scan is observed via wallet
// listeners (onSyncProgress / onBalancesChanged) rather than polled getters — during an active scan
// the worker thread is busy and direct getHeight/getBalance calls time out, so progress + balance
// are pushed into `scanState` and read from there.
import {
    type MoneroDaemonRpc,
    MoneroKeyImage,
    MoneroNetworkType,
    MoneroWalletFull,
    MoneroWalletListener,
    connectToDaemonRpc,
    createWalletFull,
    openWalletFull,
} from 'monero-ts';

import { CustomError, MESSAGES, RESPONSES } from '@trezor/blockchain-link-types';
import type {
    AccountInfo,
    MessageTypes,
    MoneroSpendableOutput,
    Response,
} from '@trezor/blockchain-link-types';

import { BaseWorker, CONTEXT, type ContextType } from '../baseWorker';
import { transformTransaction } from './transformTransaction';

const XMR_DECIMALS = 12;
// Background re-sync cadence once the wallet has caught up (new blocks). The initial catch-up scan
// runs continuously regardless; this only paces polling for fresh blocks afterwards.
const SYNC_PERIOD_MS = 10_000;
// Within this many blocks of the node tip the wallet is considered synced. A small tolerance avoids
// the "synced" state flickering off whenever a periodic re-sync picks up a new block.
const SYNCED_TOLERANCE = 2;
// Cap on a single getTxs (only issued once synced); guards against a periodic re-sync briefly
// holding the worker thread.
const GET_TXS_TIMEOUT_MS = 30_000;
// Persist the wallet cache to disk this often (counted in synced getAccountInfo polls) so a restart
// resumes from near the tip instead of re-scanning from the birthday. The wallet thread is idle when
// synced, so saving then is safe.
const SAVE_EVERY_N_SYNCED_POLLS = 16;
// Checkpoint the wallet cache to disk this often during the (long) initial scan, so quitting mid-scan
// resumes from near where it stopped instead of from the birthday. Time- (not block-) based because a
// checkpoint briefly interrupts the scan, and we want the loss bounded by wall-clock regardless of how
// fast or slow the current blocks are. See checkpointWallet for why a plain save() is not enough.
const CHECKPOINT_INTERVAL_MS = 60_000;

type ViewKey = {
    privateViewKey?: string;
    restoreHeight?: number;
    restoreDate?: { year: number; month: number };
    // Tear down the existing wallet (+ its cache file) and rebuild from the new birthday — used when
    // the user interrupts a scan to pick a different restore date.
    resetScan?: boolean;
};

// Scan from one month before the picked birthday so a slightly-too-late pick can never skip the
// wallet's first transaction (the extra ~30k blocks are cheap next to skipping years).
const restoreDateToHeight = (
    wallet: MoneroWalletFull,
    { year, month }: { year: number; month: number },
): Promise<number> => {
    let safeYear = year;
    let safeMonth = month - 1;
    if (safeMonth < 1) {
        safeMonth = 12;
        safeYear -= 1;
    }
    // Monero genesis is April 2014; never ask for a date before it.
    if (safeYear < 2014 || (safeYear === 2014 && safeMonth < 4)) {
        return Promise.resolve(0);
    }

    return wallet.getHeightByDate(safeYear, safeMonth, 1);
};

// Latest scan/balance snapshot pushed by the wallet listeners (see ScanListener). Read by
// getAccountInfo instead of querying the busy wallet directly.
type ScanState = {
    scannedHeight: number;
    chainHeight: number;
    balance: string;
    unlockedBalance: string;
    // The block the scan started from (the resolved birthday / restore height). Non-zero means the
    // scan skipped earlier history, so the UI can offer to rescan from an earlier date.
    startHeight: number;
    // Unix timestamp (seconds) of the start block — the wallet "birthday" shown in the UI. 0 = unknown.
    startTimestamp: number;
};

const EMPTY_SCAN_STATE: ScanState = {
    scannedHeight: 0,
    chainHeight: 0,
    balance: '0',
    unlockedBalance: '0',
    startHeight: 0,
    startTimestamp: 0,
};

type Context = ContextType<MoneroDaemonRpc> & {
    getUrl: () => string;
    // Non-blocking: returns the cached wallet if ready, otherwise kicks off creation on monero-ts'
    // worker thread and returns undefined. The view key (when supplied) is cached in-memory so
    // descriptor-only refreshes can (re)build the wallet without re-prompting the device every poll.
    ensureWallet: (descriptor: string, monero?: ViewKey) => MoneroWalletFull | undefined;
    // Latest scan progress + balance pushed by the wallet listeners; undefined until the first event.
    getScanState: (descriptor: string) => ScanState | undefined;
    // True once we know there is no persisted wallet and no view key — the UI must show the birthday
    // picker so the user arms the scan (vs. a wallet that is merely still being opened/built).
    needsArm: (descriptor: string) => boolean;
    // Persist the wallet cache to disk if the scan is synced (throttled). Best-effort.
    saveWalletIfSynced: (descriptor: string) => void;
};
type Request<T> = T & Context;

const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> =>
    Promise.race([
        promise,
        new Promise<T>((_, reject) =>
            setTimeout(() => reject(new Error('monero worker call timed out')), ms),
        ),
    ]);

const isSyncedState = (state: ScanState) =>
    state.chainHeight > 0 && state.scannedHeight >= state.chainHeight - SYNCED_TOLERANCE;

// Gather the wallet's currently spendable outputs for the send flow. A view-only wallet cannot
// compute key images (those need the spend key and come from the device), so this returns only what
// scanning reveals — amount, global index, subaddress, the output's one-time key and its source tx
// hash. The send pipeline resolves the rest (in-tx index, tx public key) from each source tx. Run
// only when synced (the wallet thread is otherwise busy and would time out).
//
// NOTE: getIndex() on a wallet output is its global RingCT index (what get_outs / decoy selection
// use); this must be confirmed against the device + monerod when the live send path is exercised.
const gatherSpendableOutputs = async (
    wallet: MoneroWalletFull,
    // When true, return ALL owned outputs (spent + unspent + locked + frozen) in the wallet's transfer
    // order — what the key-image-sync (import) flow needs to feed the device positionally. When false
    // (the send flow), return only the spendable subset.
    //
    // IMPORTANT (all=true): the returned order MUST equal wallet2's m_transfers order, because
    // import_key_images is positional from offset 0 (keyImages[i] -> m_transfers[i]). getOutputs
    // returns outputs in that scan/transfer order. The safety net for a misalignment is wallet2
    // verifying each spend signature against m_transfers[n]'s public key, so a wrong order throws
    // rather than corrupting state — but we additionally fail fast on any dropped output below.
    all = false,
): Promise<MoneroSpendableOutput[]> => {
    // account 0 is the standard wallet account (subaddresses are minor indices within it). For a send
    // we want only unspent, unlocked, unfrozen outputs; for an import we want every owned output.
    const outputs = await withTimeout(
        wallet.getOutputs(
            all ? { accountIndex: 0 } : { isSpent: false, isFrozen: false, accountIndex: 0 },
        ),
        GET_TXS_TIMEOUT_MS,
    );

    return outputs
        .filter(output => all || !output.getIsLocked())
        .map(output => {
            const stealthPublicKey = output.getStealthPublicKey();
            const txHash = output.getTx()?.getHash();
            const globalIndex = output.getIndex();
            if (stealthPublicKey == null || txHash == null || globalIndex == null) {
                // On the allOutputs path this set feeds wallet2's POSITIONAL import_key_images, so a
                // silently dropped hole would shift every later position and corrupt the import — fail
                // fast. On the spendable path a drop is harmless (the output is just not offered).
                if (all) {
                    throw new Error(
                        'gatherSpendableOutputs: an owned output is missing a required field; cannot build the positional key-image set',
                    );
                }

                return undefined;
            }

            return {
                amount: (output.getAmount() ?? 0n).toString(),
                globalIndex,
                subaddrMinor: output.getSubaddressIndex() ?? 0,
                stealthPublicKey,
                txHash,
                // locked/frozen are only meaningful in the allOutputs set (the spendable set is already
                // filtered on both above, so they are false there). The send skips both: a locked
                // output is not yet spendable; a frozen one wallet2 deems unsafe to spend.
                locked: Boolean(output.getIsLocked()),
                frozen: Boolean(output.getIsFrozen()),
            } satisfies MoneroSpendableOutput;
        })
        .filter((output): output is MoneroSpendableOutput => output !== undefined);
};

const getInfo = async (request: Request<MessageTypes.GetInfo>) => {
    const base = {
        url: request.getUrl(),
        name: 'Monero',
        shortcut: 'xmr',
        network: 'xmr',
        testnet: false,
        decimals: XMR_DECIMALS,
    } as const;

    try {
        const daemon = await request.connect();
        const blockHeight = await daemon.getHeight();
        // MoneroDaemonInfo getters vary by node version; read display fields defensively.
        const info = (await daemon.getInfo()) as unknown as {
            getTopBlockHash?: () => string;
            getVersion?: () => string;
        };

        return {
            type: RESPONSES.GET_INFO,
            payload: {
                ...base,
                version: info.getVersion?.() ?? '',
                blockHeight,
                blockHash: info.getTopBlockHash?.() ?? '',
            },
        } as const;
    } catch {
        // The local monerod may not be running/synced yet. Return a placeholder so accounts can
        // still be added and the backend initialised; data populates once the node is available.
        return {
            type: RESPONSES.GET_INFO,
            payload: { ...base, version: '', blockHeight: 0, blockHash: '' },
        } as const;
    }
};

const getAccountInfo = async (request: Request<MessageTypes.GetAccountInfo>) => {
    const { payload } = request;

    const account: AccountInfo = {
        descriptor: payload.descriptor,
        balance: '0',
        availableBalance: '0',
        empty: true,
        history: { total: 0, unconfirmed: 0, transactions: undefined },
    };

    try {
        // Never blocks: returns undefined while the wallet is still being created (or while monerod
        // is unreachable). The view key (when supplied) is cached so descriptor-only refreshes reuse
        // it without re-prompting the device.
        const wallet = request.ensureWallet(payload.descriptor, payload.monero);
        const state = request.getScanState(payload.descriptor);

        if (!wallet || !state) {
            // No scan yet. Either there is no persisted wallet and we need the user to arm the scan
            // (birthday picker), or the wallet is still being opened/built (UI shows a loader).
            if (request.needsArm(payload.descriptor)) {
                account.misc = { moneroNeedsArm: true };
            }

            return { type: RESPONSES.GET_ACCOUNT_INFO, payload: account } as const;
        }

        const synced = isSyncedState(state);
        request.saveWalletIfSynced(payload.descriptor);

        // Scan progress + balance come from the listeners (the wallet thread is busy scanning and
        // would time out on direct getters). Surfaced so the UI can show a scan indicator.
        account.misc = {
            moneroScan: {
                scannedHeight: state.scannedHeight,
                chainHeight: state.chainHeight,
                isSynced: synced,
                startHeight: state.startHeight,
                startTimestamp: state.startTimestamp,
            },
        };
        account.balance = state.balance;
        account.availableBalance = state.unlockedBalance;

        if (!synced) {
            // Still scanning — don't claim the account is empty and don't touch the busy wallet.
            account.empty = false;

            return { type: RESPONSES.GET_ACCOUNT_INFO, payload: account } as const;
        }

        // Key-image-sync (import) flow: the device computed a key image for every owned output;
        // importing them lets wallet2 mark spent outputs and reconstruct outgoing/self transfers, so
        // the history below shows sent/self txs and the balance is correct. Done while synced (the
        // thread is idle, so the import + save don't queue behind a scan), then persisted.
        const importKeyImages = payload.monero?.importKeyImages;
        if (importKeyImages && importKeyImages.length > 0) {
            await withTimeout(
                wallet.importKeyImages(
                    importKeyImages.map(ki => new MoneroKeyImage(ki.keyImage, ki.signature)),
                ),
                GET_TXS_TIMEOUT_MS,
            );
            request.saveWalletIfSynced(payload.descriptor);
        }

        // Read the balance straight from the (synced, idle) wallet instead of trusting the cached
        // scanState. monero-ts does not reliably fire onBalancesChanged after importKeyImages or when a
        // spend confirms in a later block, so the listener-fed value lags — most visibly stuck at 0
        // right after a send until the wallet is reopened. A direct read (the thread is idle when
        // synced, like the getTxs below) keeps the returned balance correct without forcing a restart.
        let { balance } = state;
        try {
            const [total, unlocked] = await Promise.all([
                withTimeout(wallet.getBalance(), GET_TXS_TIMEOUT_MS),
                withTimeout(wallet.getUnlockedBalance(), GET_TXS_TIMEOUT_MS),
            ]);
            balance = total.toString();
            account.balance = balance;
            account.availableBalance = unlocked.toString();
        } catch {
            // Busy or timed out mid-scan — keep the listener-provided values; the next poll refreshes.
        }

        // Synced: the worker thread is mostly idle, so transaction history can be queried safely.
        const txs = await withTimeout(wallet.getTxs(), GET_TXS_TIMEOUT_MS);
        account.history.total = txs.length;
        account.empty = txs.length === 0 && balance === '0';

        if (payload.details === 'txs') {
            account.history.transactions = txs.map(tx =>
                transformTransaction(tx, payload.descriptor),
            );
        }

        // Send flow opt-in: include the wallet's spendable outputs plus the private view key so the
        // caller can build a tx (it derives each input's commitment mask from the view key). Gated by
        // gatherOutputs, so the view key only ever rides the send-internal response, never the
        // Suite-facing path — see the confidential-data note in blockchain-link-types common.ts.
        if (payload.monero?.gatherOutputs) {
            account.misc = {
                ...account.misc,
                moneroOutputs: await gatherSpendableOutputs(wallet, payload.monero.allOutputs),
                moneroPrivateViewKey: await wallet.getPrivateViewKey().catch(() => undefined),
            };
        }
    } catch {
        // The local monerod isn't reachable/synced yet, or a query timed out mid-scan. Return what
        // we have instead of failing — the next refresh picks up where the scan got to.
    }

    return { type: RESPONSES.GET_ACCOUNT_INFO, payload: account } as const;
};

const estimateFee = async (request: Request<MessageTypes.EstimateFee>) => {
    const daemon = await request.connect();
    const feeEstimate = (await daemon.getFeeEstimate()) as unknown as {
        getFee?: () => bigint;
    };
    const feePerUnit = (feeEstimate.getFee?.() ?? 0n).toString();
    const blocks =
        request.payload && Array.isArray(request.payload.blocks) ? request.payload.blocks : [1];

    return {
        type: RESPONSES.ESTIMATE_FEE,
        payload: blocks.map(() => ({ feePerUnit })),
    } as const;
};

// Relay a signed transaction (already built + signed by the send flow) to the local monerod. The
// send form's sign step produces the tx with doNotRelay set, so this is the broadcast step.
const pushTransaction = async (request: Request<MessageTypes.PushTransaction>) => {
    const daemon = await request.connect();
    // submitTxHex(..., doNotRelay=false) broadcasts; it throws / reports on a rejected transaction.
    const result = (await daemon.submitTxHex(request.payload.hex, false)) as unknown as {
        getIsGood?: () => boolean;
        getReason?: () => string;
    };
    if (result.getIsGood && !result.getIsGood()) {
        throw new CustomError(
            'websocket_error_message',
            `monerod rejected the transaction: ${result.getReason?.() || 'unknown'}`,
        );
    }

    // monerod's submit response carries no txid; the wallet scan picks the transaction up shortly.
    return { type: RESPONSES.PUSH_TRANSACTION, payload: '' } as const;
};

const subscribe = (_request: Request<MessageTypes.Subscribe>) =>
    ({ type: RESPONSES.SUBSCRIBE, payload: { subscribed: false } }) as const;

const unsubscribe = (_request: Request<MessageTypes.Unsubscribe>) =>
    ({ type: RESPONSES.UNSUBSCRIBE, payload: { subscribed: false } }) as const;

const onRequest = (request: Request<MessageTypes.Message>) => {
    switch (request.type) {
        case MESSAGES.GET_INFO:
            return getInfo(request);
        case MESSAGES.GET_ACCOUNT_INFO:
            return getAccountInfo(request);
        case MESSAGES.ESTIMATE_FEE:
            return estimateFee(request);
        case MESSAGES.PUSH_TRANSACTION:
            return pushTransaction(request);
        case MESSAGES.SUBSCRIBE:
            return subscribe(request);
        case MESSAGES.UNSUBSCRIBE:
            return unsubscribe(request);
        default:
            throw new CustomError('worker_unknown_request', `+${request.type}`);
    }
};

// Pushes scan progress + balance from the wallet's worker thread into the worker's scanState.
class ScanListener extends MoneroWalletListener {
    constructor(private readonly onUpdate: (update: Partial<ScanState>) => void) {
        super();
    }

    onSyncProgress(height: number, _startHeight: number, endHeight: number): Promise<void> {
        this.onUpdate({ scannedHeight: height, chainHeight: endHeight });

        return Promise.resolve();
    }

    onBalancesChanged(newBalance: bigint, newUnlockedBalance: bigint): Promise<void> {
        this.onUpdate({
            balance: newBalance.toString(),
            unlockedBalance: newUnlockedBalance.toString(),
        });

        return Promise.resolve();
    }
}

class MoneroWorker extends BaseWorker<MoneroDaemonRpc> {
    private url = '';
    private wallets = new Map<string, MoneroWalletFull>();
    // Descriptors whose view-only wallet is being created on the worker thread.
    private creating = new Set<string>();
    // In-memory view-key cache (in-process only; never persisted, logged, or echoed back —
    // CLAUDE.md confidential data). Captured at account add and reused for descriptor-only refreshes.
    private viewKeys = new Map<string, ViewKey>();
    // Latest scan progress + balance per descriptor, pushed by the wallet listeners.
    private scanState = new Map<string, ScanState>();
    // Descriptors with no persisted wallet and no view key — first run, the UI must offer the picker.
    private needsArmSet = new Set<string>();
    // Per-descriptor synced-poll counter, used to throttle the periodic wallet-cache save.
    private saveCounter = new Map<string, number>();
    // Per-descriptor scanned height at the last mid-scan checkpoint (skip checkpoint if no progress).
    private lastSavedHeight = new Map<string, number>();
    // Descriptors currently being checkpointed (stop→save→resume), so the timer never overlaps itself.
    private checkpointing = new Set<string>();
    // Periodic mid-scan checkpoint timer; created with the first wallet, cleared on teardown.
    private checkpointTimer: ReturnType<typeof setInterval> | undefined;

    protected isConnected(api: MoneroDaemonRpc | undefined): api is MoneroDaemonRpc {
        return !!api;
    }

    tryConnect(url: string): Promise<MoneroDaemonRpc> {
        this.url = url;

        // proxyToWorker:false constructs the daemon RPC client WITHOUT pinging monerod, so the
        // backend "connects" even while the node is still downloading / starting / syncing (or off) —
        // otherwise initBlockchain would fail and the whole account add error out before the user can
        // start the node. This is the lightweight daemon client (getInfo / fee); the wallet uses its
        // own worker-thread connection. Calls that need a live daemon handle unreachability.
        return connectToDaemonRpc({ uri: url, proxyToWorker: false });
    }

    private getScanState = (descriptor: string): ScanState | undefined =>
        this.scanState.get(descriptor);

    private needsArm = (descriptor: string): boolean => this.needsArmSet.has(descriptor);

    // Persist the wallet cache (keys + scanned outputs) to disk when the scan is synced, so a restart
    // resumes from near the tip. The wallet thread is idle when synced, so save() won't time out.
    private saveWalletIfSynced = (descriptor: string) => {
        const wallet = this.wallets.get(descriptor);
        const state = this.scanState.get(descriptor);
        if (!wallet || !state || !isSyncedState(state)) return;

        const next = (this.saveCounter.get(descriptor) ?? 0) + 1;
        this.saveCounter.set(descriptor, next);
        // Save on the first synced poll (captures the just-completed scan) and periodically after.
        if (next !== 1 && next % SAVE_EVERY_N_SYNCED_POLLS !== 0) return;

        wallet.save().catch(() => {});
    };

    // Checkpoint a still-scanning wallet to disk. A plain save() is NOT enough: monero-ts runs the
    // initial catch-up as one long sync() on its serial task queue, so a queued save() does not execute
    // until the whole scan finishes — quitting mid-scan loses everything since the last real save.
    // stopSyncing() interrupts the running sync immediately (it is not queued), which frees the queue
    // so save() actually persists; then we resume from the current height. Bounds mid-scan loss to one
    // checkpoint interval.
    private checkpointWallet = async (descriptor: string) => {
        const wallet = this.wallets.get(descriptor);
        const state = this.scanState.get(descriptor);
        // Synced wallets are handled by saveWalletIfSynced (the thread is idle then, save() is prompt).
        if (!wallet || !state || isSyncedState(state)) return;
        if (this.checkpointing.has(descriptor)) return;
        // Nothing new scanned since the last checkpoint — don't interrupt the scan for a no-op save.
        if (state.scannedHeight <= (this.lastSavedHeight.get(descriptor) ?? 0)) return;

        this.checkpointing.add(descriptor);
        try {
            await wallet.stopSyncing();
            await wallet.save();
            this.lastSavedHeight.set(descriptor, state.scannedHeight);
            await wallet.startSyncing(SYNC_PERIOD_MS);
        } catch {
            // best-effort; try again on the next interval
        } finally {
            this.checkpointing.delete(descriptor);
        }
    };

    // Resolve the wallet "birthday" — the unix timestamp of the scan's start block — and store it on
    // the scan state for the UI. Display-only and best-effort (one daemon call), so it never blocks
    // the scan; it merges into whatever the listeners have set by the time it resolves.
    private fillStartTimestamp = (descriptor: string, startHeight: number) => {
        this.connect()
            .then(daemon => daemon.getBlockByHeight(startHeight))
            .then(block => {
                const startTimestamp =
                    (block as unknown as { getTimestamp?: () => number }).getTimestamp?.() ?? 0;
                const prev = this.scanState.get(descriptor);
                if (prev) {
                    this.scanState.set(descriptor, { ...prev, startTimestamp });
                }
            })
            .catch(() => {});
    };

    // Start the periodic mid-scan checkpoint once there is a wallet to checkpoint (idempotent).
    private ensureCheckpointTimer = () => {
        if (this.checkpointTimer) return;
        this.checkpointTimer = setInterval(() => {
            this.wallets.forEach((_wallet, descriptor) => {
                this.checkpointWallet(descriptor).catch(() => {});
            });
        }, CHECKPOINT_INTERVAL_MS);
    };

    // Re-arm a scan from a new birthday: tear the current wallet (+ its on-disk cache) down, then let
    // the next poll rebuild it from the new restore date — the same path as a fresh arm, which reports
    // progress reliably. NOTE: rescanBlockchain() (an in-place reset) was tried first but it runs a
    // blocking full rescan on monero-ts' serial task queue, so the resume (startSyncing, the only thing
    // that drives progress events) queues behind it and never runs — the UI stalls at 0%. The wallet
    // file is removed via MoneroWalletFull.getFs() (Node fs); the proxyToWorker wallet has no `.fs` of
    // its own, and createWalletFull throws "already exists" if the cache file is left behind.
    private beginReset = (descriptor: string, monero: ViewKey) => {
        if (this.creating.has(descriptor)) return;

        const wallet = this.wallets.get(descriptor);
        // Block any rebuild until the teardown (stop + read key + close + unlink) has finished.
        this.creating.add(descriptor);
        this.wallets.delete(descriptor);
        this.scanState.delete(descriptor);
        this.saveCounter.delete(descriptor);
        this.lastSavedHeight.delete(descriptor);
        this.checkpointing.delete(descriptor);
        this.needsArmSet.delete(descriptor);

        const walletDir = process.env.TREZOR_MONERO_WALLET_DIR;
        const teardown = async () => {
            // The reset never re-prompts the device for the view key: reuse the cached one, or read it
            // straight from the wallet being torn down (it has it — a view-only wallet stores it).
            let privateViewKey = this.viewKeys.get(descriptor)?.privateViewKey;
            if (wallet) {
                // stopSyncing first so the queued calls below aren't stuck behind the running scan.
                await wallet.stopSyncing().catch(() => {});
                if (!privateViewKey) {
                    privateViewKey = await wallet.getPrivateViewKey().catch(() => undefined);
                }
                await wallet.close(false).catch(() => {});
            }
            if (walletDir) {
                // Node fs (the proxyToWorker wallet has no `.fs`); removing the cache lets the rebuild
                // recreate it without a "wallet already exists" error.
                const fs = MoneroWalletFull.getFs();
                const base = `${walletDir}/${descriptor}`;
                await Promise.all(
                    [base, `${base}.keys`, `${base}.address.txt`].map(file =>
                        fs.unlink(file).catch(() => {}),
                    ),
                );
            }
            // Store the recovered key + new birthday for the rebuild on the next poll. Without a key
            // (couldn't recover) flag needs-arm so the UI re-prompts via the birthday picker.
            if (privateViewKey) {
                this.viewKeys.set(descriptor, { privateViewKey, restoreDate: monero.restoreDate });
            } else {
                this.viewKeys.delete(descriptor);
                this.needsArmSet.add(descriptor);
            }
        };

        teardown().finally(() => {
            this.creating.delete(descriptor);
        });
    };

    // Returns the wallet only once it is built/opened. The first call for a descriptor starts building
    // it on monero-ts' worker thread (non-blocking) and returns undefined; progress + balance then
    // arrive via the listeners. A fresh view key (just armed) creates + persists a new wallet;
    // otherwise the persisted wallet is opened to resume the scan. With no persisted wallet and no
    // view key the descriptor is flagged needs-arm (UI shows the birthday picker).
    private ensureWallet = (descriptor: string, monero?: ViewKey): MoneroWalletFull | undefined => {
        if (monero?.resetScan) {
            // Interrupt + re-arm with a new birthday: tear the current wallet down (best-effort) and
            // rebuild from the new restore date on the next poll.
            this.beginReset(descriptor, monero);

            return undefined;
        }
        // Only a real view key updates the cache; a gather-only refresh (no key) must not overwrite it.
        if (monero?.privateViewKey) {
            this.viewKeys.set(descriptor, monero);
            this.needsArmSet.delete(descriptor);
        }

        const cached = this.wallets.get(descriptor);
        if (cached) {
            return cached;
        }
        if (this.creating.has(descriptor) || this.needsArmSet.has(descriptor)) {
            return undefined;
        }

        const key = this.viewKeys.get(descriptor);
        // Persisted wallet files (per descriptor) live in the dir the desktop app exposes; absent on
        // web/native, where the scan stays in-memory only.
        const walletDir = process.env.TREZOR_MONERO_WALLET_DIR;
        const path = walletDir ? `${walletDir}/${descriptor}` : undefined;

        if (!key && !path) {
            // No view key and nowhere to load from — cannot build.
            return undefined;
        }

        this.creating.add(descriptor);

        const build: Promise<MoneroWalletFull> = key?.privateViewKey
            ? createWalletFull({
                  path,
                  password: '',
                  networkType: MoneroNetworkType.MAINNET,
                  primaryAddress: descriptor,
                  privateViewKey: key.privateViewKey,
                  restoreHeight: key.restoreHeight,
                  server: { uri: this.url },
                  // Run the wallet (and its full-chain view-key scan) on monero-ts' own worker thread
                  // so it never blocks this process.
                  proxyToWorker: true,
              })
            : openWalletFull({
                  path,
                  password: '',
                  networkType: MoneroNetworkType.MAINNET,
                  server: { uri: this.url },
                  proxyToWorker: true,
              });

        build
            .then(async wallet => {
                this.wallets.set(descriptor, wallet);
                // The block the scan starts from; surfaced so the UI can offer to rescan earlier. For a
                // freshly created wallet it is the resolved birthday; for a resumed one, read it back.
                let startHeight = 0;
                if (key?.privateViewKey) {
                    // Freshly created: resolve the birthday to a block height (accurate, via the
                    // daemon) and persist the keys before scanning. On failure, fall back to a full
                    // scan (safe, just slower).
                    if (key.restoreDate) {
                        try {
                            startHeight = await restoreDateToHeight(wallet, key.restoreDate);
                            await wallet.setRestoreHeight(startHeight);
                        } catch {
                            // keep the default (genesis) scan
                        }
                    }
                    await wallet.save();
                } else {
                    // Resumed wallet — the restore height is in the cache; read it (idle, won't time out).
                    startHeight = await wallet.getRestoreHeight().catch(() => 0);
                }
                // Seed the scan state straight from the wallet, which is idle right after open/create.
                // A resumed, already-synced wallet won't fire onSyncProgress/onBalancesChanged (nothing
                // changed), so without this seed scanState would stay at 0 and the UI would show no
                // balance and "still scanning". The listeners update it from here as the scan runs.
                try {
                    const [scannedHeight, chainHeight, balance, unlockedBalance] =
                        await Promise.all([
                            wallet.getHeight(),
                            wallet.getDaemonHeight(),
                            wallet.getBalance().then(value => value.toString()),
                            wallet.getUnlockedBalance().then(value => value.toString()),
                        ]);
                    this.scanState.set(descriptor, {
                        scannedHeight,
                        chainHeight,
                        balance,
                        unlockedBalance,
                        startHeight,
                        startTimestamp: 0,
                    });
                } catch {
                    this.scanState.set(descriptor, { ...EMPTY_SCAN_STATE, startHeight });
                }
                // Resolve the birthday timestamp from the start block in the background (one daemon
                // call); it's display-only, so it must not delay the scan.
                this.fillStartTimestamp(descriptor, startHeight);
                await wallet.addListener(
                    new ScanListener(update => {
                        const prev = this.scanState.get(descriptor) ?? EMPTY_SCAN_STATE;
                        this.scanState.set(descriptor, { ...prev, ...update });
                    }),
                );
                // Idempotent background scan; the listeners report progress without blocking. A
                // periodic timer checkpoints the cache to disk while this runs (see checkpointWallet).
                await wallet.startSyncing(SYNC_PERIOD_MS);
                this.ensureCheckpointTimer();
            })
            .catch(() => {
                this.scanState.delete(descriptor);
                // Couldn't open a persisted wallet and have no view key in hand → first run; flag it so
                // the UI offers the birthday picker. (With a key it was a create failure — daemon
                // hiccup — so leave it retryable instead.)
                if (!key) {
                    this.needsArmSet.add(descriptor);
                }
            })
            .finally(() => {
                this.creating.delete(descriptor);
            });

        return undefined;
    };

    private clearState() {
        if (this.checkpointTimer) {
            clearInterval(this.checkpointTimer);
            this.checkpointTimer = undefined;
        }
        // Best-effort flush before dropping the wallets. stopSyncing() first so a mid-scan save isn't
        // stuck behind the running sync on monero-ts' task queue (see checkpointWallet).
        this.wallets.forEach(wallet => {
            wallet
                .stopSyncing()
                .catch(() => {})
                .then(() => wallet.save())
                .catch(() => {});
        });
        this.wallets.clear();
        this.creating.clear();
        this.viewKeys.clear();
        this.scanState.clear();
        this.needsArmSet.clear();
        this.saveCounter.clear();
        this.lastSavedHeight.clear();
        this.checkpointing.clear();
    }

    disconnect() {
        this.clearState();
        this.api = undefined;
    }

    cleanup() {
        this.clearState();
        super.cleanup();
    }

    async messageHandler(event: { data: MessageTypes.Message }) {
        try {
            if (await super.messageHandler(event)) return true;

            const request: Request<MessageTypes.Message> = {
                ...event.data,
                connect: () => this.connect(),
                post: (data: Response) => this.post(data),
                state: this.state,
                getUrl: () => this.url,
                ensureWallet: this.ensureWallet,
                getScanState: this.getScanState,
                needsArm: this.needsArm,
                saveWalletIfSynced: this.saveWalletIfSynced,
            };

            const response = await onRequest(request);
            this.post({ id: event.data.id, ...response });
        } catch (error) {
            this.errorResponse(event.data.id, error);
        }
    }
}

// export worker factory used in src/index
export default function Monero() {
    return new MoneroWorker();
}

if (CONTEXT === 'worker') {
    const module = new MoneroWorker();
    onmessage = module.messageHandler.bind(module);
}
