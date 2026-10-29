import { execFile } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import type { Address } from 'viem';

import { type AnvilFork, getFreePort } from './anvil';
import { step } from './common';
import type { NetworkToEnable } from './pageObjects/settings/settingsPage';

const execFileAsync = promisify(execFile);

// Built from docker/anvil-blockbook, which CI does before the e2e tests.
const DEFAULT_IMAGE = 'anvil-blockbook';

// Stays under the fixture's own timeout, so a stuck start fails with Blockbook's logs.
export const BLOCKBOOK_STARTUP_TIMEOUT_MS = 90_000;
const STARTUP_POLL_INTERVAL_MS = 1_000;
// Indexing from the fork's height takes a few seconds; a Blockbook still at height 0 after this long
// cannot read the fork's blocks, e.g. because it hashes their headers differently.
const NOTHING_INDEXED_TIMEOUT_MS = 15_000;
const LOG_TAIL_LINES = '50';

type BlockbookStatus = {
    blockbook: { inSync: boolean; bestHeight: number };
};

export type BlockbookAddress = {
    balance: string;
    txs: number;
    txids?: string[];
};

const createBlockchainConfig = (anvil: AnvilFork) => ({
    coin_name: 'Ethereum',
    coin_shortcut: 'ETH',
    coin_label: 'Ethereum',
    rpc_url: anvil.url,
    rpc_url_ws: anvil.wsUrl,
    rpc_user: '',
    rpc_pass: '',
    rpc_timeout: 25,
    parse: true,
    message_queue_binding: '',
    subversion: '',
    address_format: '',
    mempool_workers: 1,
    mempool_sub_workers: 1,
    block_addresses_to_keep: 300,
    averageBlockTimeMs: 1000,
    eip1559Fees: true,
    mempoolTxTimeoutHours: 48,
    queryBackendOnMempoolResync: false,
    // Internal transactions need debug_traceBlockByHash, which these tests do not depend on.
    processInternalTransactions: false,
});

/**
 * Blockbook indexing a local Anvil fork, in a Docker container on the host network. Suite connects
 * to it as a custom `blockbook` backend, so data Suite takes from Blockbook (transaction history,
 * tokens) comes from what really happened on the fork. Indexing starts at the fork's current block
 * instead of genesis, so it never reads mainnet history.
 */
export class AnvilBlockbook {
    private containerName: string | undefined;
    private configDir: string | undefined;
    private port: number | undefined;

    constructor(private readonly anvil: AnvilFork) {}

    get url() {
        if (this.port === undefined) {
            throw new Error('Anvil Blockbook not started');
        }

        return `http://127.0.0.1:${this.port}`;
    }

    /** Pass to `settingsPage.changeNetworks` to connect Suite to this Blockbook. */
    get networkToEnable(): NetworkToEnable {
        return {
            symbol: this.anvil.symbol,
            backend: { type: 'blockbook', url: this.url },
        };
    }

    @step()
    async start() {
        // The config below is Blockbook's Ethereum coin; other networks need their own coin entry.
        if (this.anvil.symbol !== 'eth') {
            throw new Error(`Anvil Blockbook supports only eth forks, not ${this.anvil.symbol}`);
        }
        this.port = await getFreePort();
        const startHeight = Number(await this.anvil.getBlockNumber());
        const configDir = await mkdtemp(path.join(tmpdir(), 'anvil-blockbook-'));
        this.configDir = configDir;
        await writeFile(
            path.join(configDir, 'blockchaincfg.json'),
            JSON.stringify(createBlockchainConfig(this.anvil)),
        );

        const containerName = `anvil-blockbook-${this.port}`;
        this.containerName = containerName;
        try {
            await execFileAsync('docker', [
                'run',
                // No --rm: a Blockbook that exits early keeps its logs for the error below; stop()
                // removes the container.
                '--detach',
                // Reaches the fork on the host's 127.0.0.1, and Suite reaches Blockbook there too.
                '--network',
                'host',
                '--name',
                containerName,
                '--volume',
                `${configDir}:/config:ro`,
                process.env.BLOCKBOOK_IMAGE ?? DEFAULT_IMAGE,
                '-blockchaincfg=/config/blockchaincfg.json',
                '-datadir=/tmp/blockbook-db',
                '-sync',
                `-blockheight=${startHeight}`,
                `-public=127.0.0.1:${this.port}`,
                '-explorer=',
                '-dbcache=0',
                '-logtostderr',
            ]);
            await this.waitUntilSynced(startHeight);
        } catch (error) {
            const logs = await this.readLogs();
            await this.stop();
            throw new Error(`Blockbook for the Anvil fork did not start: ${error}\n${logs}`, {
                cause: error,
            });
        }
    }

    private async waitUntilSynced(startHeight: number) {
        const startedAt = Date.now();
        const deadline = startedAt + BLOCKBOOK_STARTUP_TIMEOUT_MS;
        let lastStatus = 'no answer';
        while (Date.now() < deadline) {
            let status: BlockbookStatus | undefined;
            try {
                const response = await fetch(`${this.url}/api/`);
                const body = await response.text();
                lastStatus = `${response.status} ${body}`;
                if (response.ok) {
                    status = JSON.parse(body) as BlockbookStatus;
                }
            } catch (error) {
                lastStatus = `${error}`;
            }
            if (status) {
                const { inSync, bestHeight } = status.blockbook;
                if (inSync && bestHeight >= startHeight) return;
                if (bestHeight === 0 && Date.now() - startedAt > NOTHING_INDEXED_TIMEOUT_MS) {
                    throw new Error(
                        `indexed no block within ${NOTHING_INDEXED_TIMEOUT_MS} ms, last status: ${lastStatus}`,
                    );
                }
            }
            await new Promise(resolve => setTimeout(resolve, STARTUP_POLL_INTERVAL_MS));
        }

        throw new Error(
            `not in sync at height ${startHeight} within ${BLOCKBOOK_STARTUP_TIMEOUT_MS} ms, last status: ${lastStatus}`,
        );
    }

    async getAddress(address: Address): Promise<BlockbookAddress> {
        const response = await fetch(`${this.url}/api/v2/address/${address}?details=txids`);
        if (!response.ok) {
            throw new Error(`Blockbook answered ${response.status} for address ${address}`);
        }

        return response.json() as Promise<BlockbookAddress>;
    }

    private async readLogs() {
        if (!this.containerName) return '';
        try {
            const { stdout, stderr } = await execFileAsync('docker', [
                'logs',
                '--tail',
                LOG_TAIL_LINES,
                this.containerName,
            ]);

            return `${stdout}${stderr}`;
        } catch (error) {
            return `${error}`;
        }
    }

    @step()
    async stop() {
        const { containerName, configDir } = this;
        this.containerName = undefined;
        this.configDir = undefined;
        if (containerName) {
            await execFileAsync('docker', ['rm', '--force', containerName]).catch(() => {});
        }
        if (configDir) {
            await rm(configDir, { recursive: true, force: true });
        }
    }
}
