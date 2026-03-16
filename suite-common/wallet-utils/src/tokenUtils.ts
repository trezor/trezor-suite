import {
    type Explorer,
    type NetworkSymbol,
    type NetworkSymbolExtended,
    type NetworkType,
    getExplorerUrl,
    getNetworkType,
} from '@suite-common/wallet-config';
import {
    type TokenInfo,
    type TokenStandard,
    type TokenTransfer,
} from '@trezor/blockchain-link-types';
import { parseAsset } from '@trezor/blockchain-link-utils/src/blockfrost';

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

export const getAssetLogoContractAddresses = (
    symbol: NetworkSymbolExtended | undefined,
    contract: string | null | undefined,
) => {
    if (!contract || !symbol) return undefined;

    if (symbol === 'ada') {
        const policyId = getContractAddressForNetworkSymbol(symbol, contract);

        return [policyId, contract];
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

export const isTokenTransferMatchesSearch = (token: TokenTransfer, search: string) =>
    token.symbol?.toLowerCase().includes(search) ||
    token.name?.toLowerCase().includes(search) ||
    token.contract.toLowerCase().includes(search);

export const isNftMatchesSearch = (token: TokenInfo, search: string) =>
    token.symbol?.toLowerCase().includes(search) ||
    token.name?.toLowerCase().includes(search) ||
    token.contract?.toLowerCase().includes(search);

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
