import {
    type Explorer,
    type NetworkSymbolExtended,
    type NetworkType,
    getExplorerUrl,
} from '@suite-common/wallet-config';
import { TokenInfo } from '@trezor/blockchain-link-types';
import { parseAsset } from '@trezor/blockchain-link-utils/src/blockfrost';

export const getContractAddressForNetworkSymbol = (
    symbol: NetworkSymbolExtended, // unknown symbols will result to lowerCase
    contractAddress: string,
) => {
    switch (symbol) {
        case 'eth':
            // Specifying most common network as first case improves performance little bit
            return contractAddress.toLowerCase();
        case 'sol':
        case 'dsol':
            return contractAddress;
        case 'ada':
        case 'tada': {
            const { policyId } = parseAsset(contractAddress);

            return policyId.toLowerCase();
        }
        default:
            return contractAddress.toLowerCase();
    }
};

export const getTokenExplorerUrl = (
    explorer: Explorer,
    networkType: NetworkType,
    token: Pick<TokenInfo, 'contract' | 'fingerprint'>,
) => {
    const suffix = networkType === 'cardano' ? 'token' : 'account';
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
    const explorerUrl = getExplorerUrl(explorer, 'account');
    const contractAddress = nft.contract;
    const queryString = explorer.queryString ?? '';

    return `${explorerUrl}${contractAddress}${queryString}`;
};
