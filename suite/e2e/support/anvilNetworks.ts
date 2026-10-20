import { type NetworkSymbol, getNetworkOptional } from '@suite-common/wallet-config';

// Public endpoints, so no secret is needed in CI. ANVIL_FORK_URL_<SYMBOL> points a run elsewhere,
// e.g. at an archive node when a test outlives the few minutes of recent state a public L2 node
// keeps. Keyed by plain string: NetworkSymbol is branded, so literal keys would not satisfy it.
const ANVIL_FORK_URLS: Readonly<Partial<Record<string, string>>> = {
    eth: 'https://eth-mainnet.g.alchemy.com/public',
    base: 'https://mainnet.base.org',
    arb: 'https://arb1.arbitrum.io/rpc',
    op: 'https://mainnet.optimism.io',
    pol: 'https://polygon-rpc.com',
    bsc: 'https://bsc-dataseed.bnb.org',
    avax: 'https://api.avax.network/ext/bc/C/rpc',
};

export type AnvilForkOptions = {
    symbol: NetworkSymbol;
    /** Defaults to ANVIL_FORK_URL_<SYMBOL>, then to the network's public endpoint. */
    forkUrl?: string;
    /** Defaults to ANVIL_FORK_BLOCK_NUMBER_<SYMBOL>, then to the latest block. */
    blockNumber?: number;
    /** When false, transactions wait in the mempool until `mine()`. Defaults to true. */
    automine?: boolean;
    /**
     * Seconds between blocks mined on top of automine, so the chain keeps moving like a real one.
     * Suite's evm-rpc worker reads Transfer logs 2 blocks behind the tip, so without new blocks it
     * would never see the newest transfers. 0 turns it off. Defaults to 1.
     */
    blockTime?: number;
    /** Base fee of the first block mined on the fork, in wei. */
    baseFeePerGas?: bigint;
};

export type AnvilForkConfig = Required<
    Pick<AnvilForkOptions, 'symbol' | 'forkUrl' | 'automine' | 'blockTime'>
> &
    Pick<AnvilForkOptions, 'blockNumber' | 'baseFeePerGas'> & { chainId: number };

const getEnv = (name: string, symbol: NetworkSymbol) =>
    process.env[`${name}_${symbol.toUpperCase()}`];

export const getAnvilForkConfig = (options: AnvilForkOptions): AnvilForkConfig => {
    const { symbol } = options;
    const network = getNetworkOptional(symbol);
    const supportsEvmRpc = network?.backendOptions.some(({ type }) => type === 'evm-rpc');

    if (network?.chainId === undefined || !supportsEvmRpc) {
        throw new Error(`Network ${symbol} cannot be forked: it has no evm-rpc backend in Suite`);
    }

    const forkUrl = options.forkUrl ?? getEnv('ANVIL_FORK_URL', symbol) ?? ANVIL_FORK_URLS[symbol];
    if (!forkUrl) {
        throw new Error(
            `No fork URL for ${symbol}: pass forkUrl, set ANVIL_FORK_URL_${symbol.toUpperCase()} or add a default to ANVIL_FORK_URLS`,
        );
    }

    const envBlockNumber = getEnv('ANVIL_FORK_BLOCK_NUMBER', symbol);

    return {
        symbol,
        chainId: network.chainId,
        forkUrl,
        blockNumber: options.blockNumber ?? (envBlockNumber ? Number(envBlockNumber) : undefined),
        automine: options.automine ?? true,
        blockTime: options.blockTime ?? 1,
        baseFeePerGas: options.baseFeePerGas,
    };
};
