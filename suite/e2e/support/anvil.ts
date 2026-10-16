import { type ChildProcess, spawn } from 'node:child_process';
import { createServer } from 'node:net';
import {
    type Address,
    type Hex,
    createTestClient,
    encodeAbiParameters,
    erc20Abi,
    http,
    keccak256,
    numberToHex,
    publicActions,
} from 'viem';

import { step } from './common';

// Public endpoint, so no secret is needed in CI. ANVIL_FORK_URL points a local run elsewhere.
const DEFAULT_FORK_URL = 'https://eth-mainnet.g.alchemy.com/public';
const ETHEREUM_CHAIN_ID = 1;

const STARTUP_TIMEOUT_MS = 60_000;
const STARTUP_POLL_INTERVAL_MS = 250;
const OUTPUT_TAIL_LENGTH = 4_000;

// Solidity places `mapping(address => uint256) balances` at the slot of its declaration, which
// differs per token; the probe covers the usual range (USDC keeps balances at slot 9).
const MAX_BALANCE_SLOT_PROBE = 20;

const getFreePort = () =>
    new Promise<number>((resolve, reject) => {
        const server = createServer();
        server.unref();
        server.on('error', reject);
        server.listen(0, '127.0.0.1', () => {
            const address = server.address();
            if (address === null || typeof address === 'string') {
                server.close();
                reject(new Error('Could not determine a free port for anvil'));

                return;
            }
            server.close(() => resolve(address.port));
        });
    });

const createAnvilClient = (url: string) =>
    createTestClient({ mode: 'anvil', transport: http(url) }).extend(publicActions);

const getMappingSlot = (key: Address, slot: number) =>
    keccak256(encodeAbiParameters([{ type: 'address' }, { type: 'uint256' }], [key, BigInt(slot)]));

/**
 * Local Anvil fork of Ethereum mainnet. Suite connects to it as a custom `evm-rpc` backend, so
 * signed transactions are really executed and the resulting chain state can be asserted.
 */
export class AnvilFork {
    private process: ChildProcess | undefined;
    private client: ReturnType<typeof createAnvilClient> | undefined;
    private port: number | undefined;
    private output = '';

    get url() {
        if (this.port === undefined) {
            throw new Error('Anvil fork not started');
        }

        return `http://127.0.0.1:${this.port}`;
    }

    private get rpc() {
        if (!this.client) {
            throw new Error('Anvil fork not started');
        }

        return this.client;
    }

    private appendOutput(chunk: Buffer) {
        this.output = (this.output + chunk.toString()).slice(-OUTPUT_TAIL_LENGTH);
    }

    @step()
    async start() {
        this.port = await getFreePort();
        const forkBlockNumber = process.env.ANVIL_FORK_BLOCK_NUMBER;
        const args = [
            '--fork-url',
            process.env.ANVIL_FORK_URL ?? DEFAULT_FORK_URL,
            ...(forkBlockNumber ? ['--fork-block-number', forkBlockNumber] : []),
            '--chain-id',
            `${ETHEREUM_CHAIN_ID}`,
            '--host',
            '127.0.0.1',
            '--port',
            `${this.port}`,
            // The public endpoint rate-limits; back off instead of failing the forked read.
            '--retries',
            '10',
            '--fork-retry-backoff',
            '1000',
        ];

        const anvilProcess = spawn(process.env.ANVIL_BIN ?? 'anvil', args, {
            stdio: ['ignore', 'pipe', 'pipe'],
        });
        this.process = anvilProcess;
        anvilProcess.stdout?.on('data', chunk => this.appendOutput(chunk));
        anvilProcess.stderr?.on('data', chunk => this.appendOutput(chunk));

        let exitReason: string | undefined;
        anvilProcess.on('error', error => {
            exitReason =
                'code' in error && error.code === 'ENOENT'
                    ? 'anvil binary not found. Install Foundry (`curl -L https://foundry.paradigm.xyz | bash && foundryup`) or set ANVIL_BIN.'
                    : error.message;
        });
        anvilProcess.on('exit', code => {
            exitReason ??= `anvil exited with code ${code}`;
        });

        this.client = createAnvilClient(this.url);
        const deadline = Date.now() + STARTUP_TIMEOUT_MS;
        while (Date.now() < deadline) {
            if (exitReason) {
                throw new Error(`${exitReason}\n${this.output}`);
            }
            try {
                const chainId = await this.rpc.getChainId();
                if (chainId === ETHEREUM_CHAIN_ID) return;
            } catch {
                // Not listening yet, the fork is still being set up.
            }
            await new Promise(resolve => setTimeout(resolve, STARTUP_POLL_INTERVAL_MS));
        }

        await this.stop();
        throw new Error(`anvil did not start within ${STARTUP_TIMEOUT_MS} ms\n${this.output}`);
    }

    @step()
    async stop() {
        const anvilProcess = this.process;
        this.process = undefined;
        this.client = undefined;
        if (!anvilProcess || anvilProcess.exitCode !== null) return;

        const exited = new Promise(resolve => anvilProcess.once('exit', resolve));
        anvilProcess.kill();
        await exited;
    }

    // No @step on methods taking a bigint: the decorator serializes arguments with JSON.stringify.
    async setBalance(address: Address, value: bigint) {
        await this.rpc.setBalance({ address, value });
    }

    getBalance(address: Address) {
        return this.rpc.getBalance({ address });
    }

    getTransactionCount(address: Address) {
        return this.rpc.getTransactionCount({ address });
    }

    readErc20Balance(token: Address, holder: Address) {
        return this.rpc.readContract({
            address: token,
            abi: erc20Abi,
            functionName: 'balanceOf',
            args: [holder],
        });
    }

    readErc20Allowance(token: Address, owner: Address, spender: Address) {
        return this.rpc.readContract({
            address: token,
            abi: erc20Abi,
            functionName: 'allowance',
            args: [owner, spender],
        });
    }

    /**
     * Sets an ERC-20 balance by writing the token's balance mapping directly, as Foundry's `deal`
     * does. The mapping slot is found by probing; slots that turn out wrong are restored.
     */
    async dealErc20(token: Address, holder: Address, amount: bigint) {
        const value = numberToHex(amount, { size: 32 });

        for (let slot = 0; slot <= MAX_BALANCE_SLOT_PROBE; slot++) {
            const index = getMappingSlot(holder, slot);
            const previous: Hex =
                (await this.rpc.getStorageAt({ address: token, slot: index })) ??
                numberToHex(0, { size: 32 });

            await this.rpc.setStorageAt({ address: token, index, value });
            if ((await this.readErc20Balance(token, holder)) === amount) return;
            await this.rpc.setStorageAt({ address: token, index, value: previous });
        }

        throw new Error(`Could not find the balance slot of token ${token}`);
    }
}
