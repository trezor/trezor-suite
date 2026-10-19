import { type ChildProcess, spawn } from 'node:child_process';
import { createServer } from 'node:net';
import {
    type Abi,
    type Address,
    type ContractFunctionArgs,
    type ContractFunctionName,
    type EncodeFunctionDataParameters,
    type Hash,
    type Hex,
    type ReadContractParameters,
    type ReadContractReturnType,
    createTestClient,
    encodeAbiParameters,
    encodeFunctionData,
    erc20Abi,
    http,
    keccak256,
    numberToHex,
    publicActions,
    walletActions,
} from 'viem';

import { type AnvilForkConfig, type AnvilForkOptions, getAnvilForkConfig } from './anvilNetworks';
import { step } from './common';
import type { NetworkToEnable } from './pageObjects/settings/settingsPage';

const STARTUP_TIMEOUT_MS = 60_000;
const STARTUP_POLL_INTERVAL_MS = 250;
const OUTPUT_TAIL_LENGTH = 4_000;

// Solidity places `mapping(address => uint256) balances` at the slot of its declaration, which
// differs per token; the probe covers the usual range (USDC keeps balances at slot 9).
const MAX_BALANCE_SLOT_PROBE = 20;

// Holds tokens only between the storage write and the transfer in `fundErc20`.
const ERC20_FUNDER_ADDRESS = '0x000000000000000000000000000000000000f00d';
// Gas reserve given to an impersonated account whose balance cannot cover a transaction.
const GAS_TOP_UP = 10n ** 18n;

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
    createTestClient({ mode: 'anvil', transport: http(url) })
        .extend(publicActions)
        .extend(walletActions);

type AnvilClient = ReturnType<typeof createAnvilClient>;

const getMappingSlot = (key: Address, slot: number) =>
    keccak256(encodeAbiParameters([{ type: 'address' }, { type: 'uint256' }], [key, BigInt(slot)]));

const getAnvilArgs = (config: AnvilForkConfig, port: number) => [
    '--fork-url',
    config.forkUrl,
    ...(config.blockNumber !== undefined ? ['--fork-block-number', `${config.blockNumber}`] : []),
    ...(config.baseFeePerGas !== undefined ? ['--base-fee', `${config.baseFeePerGas}`] : []),
    ...(config.automine ? [] : ['--no-mining']),
    '--chain-id',
    `${config.chainId}`,
    '--host',
    '127.0.0.1',
    '--port',
    `${port}`,
    // Public endpoints rate-limit; back off instead of failing the forked read.
    '--retries',
    '10',
    '--fork-retry-backoff',
    '1000',
];

type SendTransactionAsParams = { to: Address; value?: bigint; data?: Hex };

/**
 * Local Anvil fork of an EVM network. Suite connects to it as a custom `evm-rpc` backend, so
 * signed transactions are really executed and the resulting chain state can be asserted.
 */
export class AnvilFork {
    private readonly config: AnvilForkConfig;
    private automine: boolean;
    private process: ChildProcess | undefined;
    private client: AnvilClient | undefined;
    private port: number | undefined;
    private output = '';

    constructor(options: AnvilForkOptions) {
        this.config = getAnvilForkConfig(options);
        this.automine = this.config.automine;
    }

    get url() {
        if (this.port === undefined) {
            throw new Error('Anvil fork not started');
        }

        return `http://127.0.0.1:${this.port}`;
    }

    /** Pass to `settingsPage.changeNetworks` to connect Suite to this fork. */
    get networkToEnable(): NetworkToEnable {
        return { symbol: this.config.symbol, backend: { type: 'evm-rpc', url: this.url } };
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
        const anvilProcess = spawn(
            process.env.ANVIL_BIN ?? 'anvil',
            getAnvilArgs(this.config, this.port),
            { stdio: ['ignore', 'pipe', 'pipe'] },
        );
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
                if (chainId === this.config.chainId) return;
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

    // Accounts

    @step()
    async setBalance(address: Address, value: bigint) {
        await this.rpc.setBalance({ address, value });
    }

    getBalance(address: Address) {
        return this.rpc.getBalance({ address });
    }

    getTransactionCount(address: Address) {
        return this.rpc.getTransactionCount({ address });
    }

    // Contracts and tokens

    readContract<
        const TAbi extends Abi | readonly unknown[],
        TFunctionName extends ContractFunctionName<TAbi, 'pure' | 'view'>,
        const TArgs extends ContractFunctionArgs<TAbi, 'pure' | 'view', TFunctionName>,
    >(
        params: ReadContractParameters<TAbi, TFunctionName, TArgs>,
    ): Promise<ReadContractReturnType<TAbi, TFunctionName, TArgs>> {
        return this.rpc.readContract(params);
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

    async readErc20Metadata(token: Address) {
        const [symbol, decimals] = await Promise.all([
            this.rpc.readContract({ address: token, abi: erc20Abi, functionName: 'symbol' }),
            this.rpc.readContract({ address: token, abi: erc20Abi, functionName: 'decimals' }),
        ]);

        return { symbol, decimals };
    }

    /**
     * Sends `amount` of an ERC-20 token to `holder` in a real `transfer`. The evm-rpc backend finds
     * an account's tokens only through their `Transfer` logs, so a balance written straight into
     * storage would stay invisible to Suite.
     */
    @step()
    async fundErc20(token: Address, holder: Address, amount: bigint) {
        await this.dealErc20(token, ERC20_FUNDER_ADDRESS, amount);

        return this.writeContractAs(ERC20_FUNDER_ADDRESS, {
            address: token,
            abi: erc20Abi,
            functionName: 'transfer',
            args: [holder, amount],
        });
    }

    /**
     * Sets an ERC-20 balance by writing the token's balance mapping directly, as Foundry's `deal`
     * does. The mapping slot is found by probing; slots that turn out wrong are restored.
     */
    private async dealErc20(token: Address, holder: Address, amount: bigint) {
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

    // Acting as other accounts

    /**
     * Sends a transaction from any address without its key, e.g. an incoming transfer to the
     * account under test or a protocol action. An account that cannot cover value plus gas is
     * topped up first.
     * With automine on, resolves once the transaction is mined and fails if it reverted; with
     * automine off, resolves as soon as it is in the mempool.
     */
    @step()
    async sendTransactionAs(from: Address, { to, value, data }: SendTransactionAsParams) {
        // Mainnet addresses often hold dust, so an empty balance is not the only one that falls short.
        const required = (value ?? 0n) + GAS_TOP_UP;
        if ((await this.getBalance(from)) < required) {
            await this.setBalance(from, required);
        }

        await this.rpc.impersonateAccount({ address: from });
        try {
            const hash = await this.rpc.sendTransaction({
                account: from,
                chain: null,
                to,
                value,
                data,
            });
            if (this.automine) {
                const receipt = await this.rpc.waitForTransactionReceipt({ hash });
                if (receipt.status !== 'success') {
                    throw new Error(`Transaction ${hash} from ${from} to ${to} reverted`);
                }
            }

            return hash;
        } finally {
            await this.rpc.stopImpersonatingAccount({ address: from });
        }
    }

    @step()
    sendNativeAs(from: Address, to: Address, value: bigint) {
        return this.sendTransactionAs(from, { to, value });
    }

    // No @step: it would print the whole ABI; the step comes from sendTransactionAs.
    writeContractAs<
        const TAbi extends Abi | readonly unknown[],
        TFunctionName extends ContractFunctionName<TAbi>,
    >(
        from: Address,
        {
            address,
            value,
            ...call
        }: EncodeFunctionDataParameters<TAbi, TFunctionName> & { address: Address; value?: bigint },
    ) {
        return this.sendTransactionAs(from, {
            to: address,
            value,
            data: encodeFunctionData(call as EncodeFunctionDataParameters),
        });
    }

    // Mining and time

    /** With automine off, transactions Suite broadcasts stay pending until `mine()`. */
    @step()
    async setAutomine(enabled: boolean) {
        await this.rpc.setAutomine(enabled);
        this.automine = enabled;
    }

    @step()
    async mine(blocks = 1) {
        await this.rpc.mine({ blocks });
    }

    async getPendingTransactionHashes(): Promise<Hash[]> {
        const { pending } = await this.rpc.getTxpoolContent();

        return Object.values(pending).flatMap(byNonce =>
            Object.values(byNonce).map(transaction => transaction.hash),
        );
    }

    /** Removes a pending transaction from the mempool, as if the network never picked it up. */
    @step()
    async dropTransaction(hash: Hash) {
        await this.rpc.dropTransaction({ hash });
    }

    /** Moves chain time forward and mines a block, so the next block carries the new time. */
    @step()
    async increaseTime(seconds: number) {
        await this.rpc.increaseTime({ seconds });
        await this.mine();
    }

    @step()
    async setNextBlockBaseFee(baseFeePerGas: bigint) {
        await this.rpc.setNextBlockBaseFeePerGas({ baseFeePerGas });
    }

    // Snapshots

    snapshot() {
        return this.rpc.snapshot();
    }

    @step()
    async revert(id: Hex) {
        await this.rpc.revert({ id });
    }
}
