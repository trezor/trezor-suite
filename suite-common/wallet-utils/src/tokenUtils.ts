import {
    type Explorer,
    type NetworkSymbol,
    type NetworkSymbolExtended,
    type NetworkType,
    getExplorerUrl,
    getNetworkDisplaySymbol,
    getNetworkType,
} from '@suite-common/wallet-config';
import { type WalletAccountTransaction } from '@suite-common/wallet-types';
import {
    type EthereumSpecific,
    type TokenInfo,
    type TokenStandard,
    type TokenTransfer,
} from '@trezor/blockchain-link-types';
import { parseAsset } from '@trezor/blockchain-link-utils/src/blockfrost';
import stellar from '@trezor/network-stellar/runtime';

export const getContractAddressForNetworkSymbol = (
    symbol: NetworkSymbolExtended,
    contractAddress: string,
) => {
    const networkType = getNetworkType(symbol.toLowerCase() as NetworkSymbol);

    switch (networkType) {
        case 'ethereum':
            return contractAddress.toLowerCase();
        case 'cardano': {
            const { policyId } = parseAsset(contractAddress);

            return policyId.toLowerCase();
        }
        default:
            return contractAddress;
    }
};

type StellarRuntime = Awaited<ReturnType<typeof stellar>>;

let loadedStellarRuntime: StellarRuntime | undefined;
let stellarRuntimePromise: Promise<StellarRuntime> | undefined;

// the Stellar module is chunk-split on web, so it is fetched lazily on the first
// XLM call and cached, which lets all subsequent calls read it synchronously
const loadStellarRuntime = () => {
    stellarRuntimePromise ??= stellar().then(runtime => {
        loadedStellarRuntime = runtime;

        return runtime;
    });

    return stellarRuntimePromise;
};

const getXlmAssetLogoContractAddresses = (contract: string, stellarRuntime: StellarRuntime) => {
    try {
        const { sorobanAssetContractId } = stellarRuntime.computeSorobanAssetContractId(contract);

        // keep the classic contract first until CoinGecko finishes the Stellar migration
        // once Soroban ids become the primary CDN key, flip the order to reduce retries
        return [contract, sorobanAssetContractId];
    } catch {
        // a malformed classic contract has no derivable Soroban ID
        // but the classic ID itself may still resolve on the CDN
        return [contract];
    }
};

/**
 * Returns the contract address candidates under which an asset logo may be stored on the
 * CoinGecko CDN. Resolves synchronously whenever possible so hot paths like token icon lists
 * can render without an async placeholder frame; only the first xlm call returns a promise
 * while the lazily loaded stellar module is being fetched.
 */
export const getAssetLogoContractAddresses = (
    symbol: NetworkSymbolExtended | undefined,
    contract: string | null | undefined,
): string[] | Promise<string[]> | undefined => {
    if (!contract || !symbol) return undefined;

    if (symbol === 'ada') {
        const policyId = getContractAddressForNetworkSymbol(symbol, contract);

        return [policyId, contract];
    }

    // CoinGecko is gradually migrating Stellar token ids from the classic
    // `CODE-ISSUER` form used at runtime to Soroban contract addresses. Once a
    // token is migrated, its icon on the CDN is stored under the Soroban
    // filename. Fall back to the locally-derived Soroban asset contract id so
    // the icon is still reachable.
    if (symbol === 'xlm') {
        if (loadedStellarRuntime) {
            return getXlmAssetLogoContractAddresses(contract, loadedStellarRuntime);
        }

        return loadStellarRuntime().then(stellarRuntime =>
            getXlmAssetLogoContractAddresses(contract, stellarRuntime),
        );
    }

    return [getContractAddressForNetworkSymbol(symbol, contract)];
};

export const getTokenExplorerUrl = (
    explorer: Explorer,
    networkType: NetworkType,
    token: Pick<TokenInfo, 'contract' | 'fingerprint'>,
) => {
    const suffix = networkType === 'cardano' || networkType === 'stellar' ? 'token' : 'address';
    const explorerUrl = getExplorerUrl(explorer, suffix);
    const contractAddress = networkType === 'cardano' ? token.fingerprint : token.contract;
    const queryString = explorer.queryString ?? '';

    return `${explorerUrl}${contractAddress}${queryString}`;
};

export const getNftExplorerUrl = (explorer: Explorer, nft: TokenInfo, id: string) => {
    const explorerUrl = getExplorerUrl(explorer, 'nft');
    const contractAddressWithId = nft.contract + `/${id}`;
    const queryString = explorer.queryString ?? ''; // queryString is used for solana only.

    return `${explorerUrl}${contractAddressWithId}${queryString}`;
};

export const getNftContractExplorerUrl = (explorer: Explorer, nft: TokenInfo) => {
    const explorerUrl = getExplorerUrl(explorer, 'address');
    const contractAddress = nft.contract;
    const queryString = explorer.queryString ?? '';

    return `${explorerUrl}${contractAddress}${queryString}`;
};

export const isTokenMatchesSearch = (token: TokenInfo, rawSearch: string) => {
    const search = rawSearch.toLowerCase();

    return (
        token.symbol?.toLowerCase().includes(search) ||
        token.name?.toLowerCase().includes(search) ||
        token.contract.toLowerCase().includes(search) ||
        token.fingerprint?.toLowerCase().includes(search) ||
        token.policyId?.toLowerCase().includes(search)
    );
};

const isTokenNameMatchesSearch = (name: string | undefined, search: string) =>
    name
        ?.toLowerCase()
        .split(/\s+/)
        .some(word => word.startsWith(search)) ?? false;

export const isTokenTransferMatchesSearch = (token: TokenTransfer, search: string) =>
    token.symbol?.toLowerCase().includes(search) ||
    isTokenNameMatchesSearch(token.name, search) ||
    token.contract.toLowerCase().includes(search);

export const isNativeDisplaySymbolSearch = (symbol: NetworkSymbol, search: string) =>
    getNetworkDisplaySymbol(symbol).toLowerCase() === search;

export const isNativeTransferMatchesSearch = (
    transaction: WalletAccountTransaction,
    search: string,
) => {
    if (!isNativeDisplaySymbolSearch(transaction.symbol, search)) {
        return false;
    }

    const hasNativeInternalTransfer = transaction.internalTransfers.some(
        transfer => transfer.type === 'sent' || transfer.type === 'recv',
    );
    const hasNativeAmount =
        ['sent', 'recv', 'joint', 'contract'].includes(transaction.type) &&
        transaction.amount !== '0';

    return hasNativeInternalTransfer || hasNativeAmount;
};

export const isNftMatchesSearch = (token: TokenInfo, search: string) =>
    token.symbol?.toLowerCase().includes(search) ||
    token.name?.toLowerCase().includes(search) ||
    token.contract?.toLowerCase().includes(search);

export const isFunctionSelectorMatchesSearch = (evmSpecific: EthereumSpecific, search: string) => {
    if (evmSpecific?.parsedData?.name.toLowerCase().includes(search.toLowerCase())) return true;

    return false;
};

const PRESERVE_TOKEN_SYMBOL_CASE_STANDARDS: ReadonlySet<TokenStandard> = new Set([
    'ERC20',
    'ERC721',
    'ERC1155',
    'BEP20',
    'BEP721',
    'BEP1155',
    'TRC10',
    'TRC20',
]);

export const shouldUppercaseTokenSymbol = (token: TokenInfo) =>
    token.standard ? !PRESERVE_TOKEN_SYMBOL_CASE_STANDARDS.has(token.standard) : true;

export const isErc4626 = (token?: TokenInfo | null) =>
    !!token && (token.protocols?.includes('erc4626') ?? false);

export const getErc4626Contracts = (tokens: TokenInfo[] | undefined) =>
    // `TokenInfo.contract` is typed as a required string, but the value originates from an
    // untrusted/user-selectable backend where the field is optional (Token.contract?: string).
    // A malicious backend returning an erc4626-tagged token without `contract` would otherwise
    // throw on `.toLowerCase()` and crash the render-time TransactionsGroup (no ErrorBoundary),
    // the memoized transactions selector, and the fiat-rates thunk. Drop non-string records.
    new Set(
        tokens
            ?.filter(isErc4626)
            .map(token => token.contract)
            .filter((contract): contract is string => typeof contract === 'string')
            .map(contract => contract.toLowerCase()),
    );

export const sortTokensByName = (a: Pick<TokenInfo, 'name'>, b: Pick<TokenInfo, 'name'>) =>
    (a.name ?? '').localeCompare(b.name ?? '');
