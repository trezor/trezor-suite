import { BaseProcess, type Status } from './BaseProcess';

type MonerodNetwork = 'mainnet' | 'stagenet';

export interface MonerodConnectionOptions {
    network: MonerodNetwork;
    host: string;
    rpcPort: number;
    // Separate restricted RPC port (loopback) that is safe to expose to remote clients, e.g. over
    // a Totem Tor onion. Hides admin commands; the local wallet keeps using the unrestricted port.
    restrictedRpcPort: number;
    p2pPort: number;
    zmqPort: number;
    dataDir: string;
    binDir: string;
}

export type MonerodProcessStatus = Status & {
    synchronized?: boolean;
    syncProgress?: {
        current: number;
        total: number;
    };
};

/**
 * Manages a local `monerod` (Monero daemon) child process.
 *
 * Unlike Tor/coinjoin, the binary is NOT bundled into app resources — it is
 * downloaded at runtime into the user-data directory (see ./libs/monerod/downloadMonerod),
 * so the binary path is resolved from there instead of `resourcesPath`.
 *
 * `status()` queries the loopback JSON-RPC `get_info` endpoint, which is bound
 * to 127.0.0.1 only. The private view key never reaches this daemon — it only serves
 * block data; output scanning happens client-side (monero-gui model).
 */
export class MonerodProcess extends BaseProcess {
    private readonly network: MonerodNetwork;
    private readonly host: string;
    private readonly rpcPort: number;
    private readonly restrictedRpcPort: number;
    private readonly p2pPort: number;
    private readonly zmqPort: number;
    private readonly dataDir: string;
    private readonly binDir: string;

    constructor(options: MonerodConnectionOptions) {
        super('monerod', 'monerod', { autoRestart: 0, stopKillWait: 10 });
        this.network = options.network;
        this.host = options.host;
        this.rpcPort = options.rpcPort;
        this.restrictedRpcPort = options.restrictedRpcPort;
        this.p2pPort = options.p2pPort;
        this.zmqPort = options.zmqPort;
        this.dataDir = options.dataDir;
        this.binDir = options.binDir;
    }

    protected getProcessDir() {
        return this.binDir;
    }

    private get rpcUrl() {
        return `http://${this.host}:${this.rpcPort}/json_rpc`;
    }

    async status(): Promise<MonerodProcessStatus> {
        try {
            const response = await fetch(this.rpcUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jsonrpc: '2.0', id: '0', method: 'get_info' }),
            });

            if (response.ok) {
                const data: any = await response.json();
                const result = data?.result;
                if (result?.status === 'OK') {
                    const current = Number(result.height ?? 0);
                    // When fully synced, `target_height` is reported as 0.
                    const total = Number(result.target_height) || current;

                    return {
                        service: true,
                        process: Boolean(this.process),
                        synchronized: Boolean(result.synchronized),
                        syncProgress: { current, total },
                    };
                }
            }
        } catch {
            // RPC not ready yet (daemon still starting up)
        }

        return { service: false, process: Boolean(this.process) };
    }

    start() {
        const args = [
            `--data-dir=${this.dataDir}`,
            `--rpc-bind-ip=${this.host}`,
            `--rpc-bind-port=${this.rpcPort}`,
            // Second, restricted RPC endpoint (loopback) — this is the only port Totem exposes over
            // the onion, so remote tribe members get block data + tx submission but not admin RPC.
            // The local wallet still uses the unrestricted port above (see the double-spend note).
            `--rpc-restricted-bind-ip=${this.host}`,
            `--rpc-restricted-bind-port=${this.restrictedRpcPort}`,
            `--p2p-bind-port=${this.p2pPort}`,
            `--zmq-rpc-bind-port=${this.zmqPort}`,
            // Loopback-only personal node (the monero-gui local-node model): the RPC is bound to
            // 127.0.0.1 and never exposed. We intentionally do NOT pass `--restricted-rpc` — restricted
            // mode hides locally-pooled (do_not_relay / not-yet-relayed) transactions from
            // `is_key_image_spent` and `get_transactions`, which would blind the send flow's spent-input
            // check and let it re-select an input that is already pending in a local tx, producing a
            // double-spend. An unrestricted loopback node also lets the wallet recover a stuck pool via
            // `flush_txpool`.
            '--no-igd',
            '--hide-my-port',
            '--non-interactive',
            // Pruned node keeps the footprint at ~tens of GB instead of the full chain.
            // We deliberately do NOT pass `--sync-pruned-blocks`: that only fetches pre-pruned
            // blocks from peers that serve them, which can stall mid-sync when the current peer
            // set lacks the matching pruning seeds. Downloading full blocks and pruning locally is
            // slower on bandwidth but far more reliable (any peer can serve the next block).
            '--prune-blockchain',
            // Keep a healthy, diverse outbound peer set so a few bad/slow peers can't stall sync.
            '--out-peers=16',
        ];

        if (this.network === 'stagenet') {
            args.push('--stagenet');
        }

        return super.start(args);
    }
}
