import type { Network, NetworkSymbolExtended } from '@suite-common/wallet-config';
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
    network: Network,
    token: Pick<TokenInfo, 'contract' | 'fingerprint'>,
) => {
    const explorerUrl =
        network.networkType === 'cardano' ? network.explorer.token : network.explorer.account;
    const contractAddress = network.networkType === 'cardano' ? token.fingerprint : token.contract;
    const queryString = network.explorer.queryString ?? '';

    return `${explorerUrl}${contractAddress}${queryString}`;
};

export const getNftExplorerUrl = (network: Network, nft: TokenInfo, id: string) => {
    const explorerUrl = network.explorer.nft;
    const contractAddressWithId = nft.contract + `/${id}`;
    const queryString = network.explorer.queryString ?? ''; // queryString is used for solana only.

    return `${explorerUrl}${contractAddressWithId}${queryString}`;
};

export const getNftContractExplorerUrl = (network: Network, nft: TokenInfo) => {
    const explorerUrl = network.explorer.account;
    const contractAddress = nft.contract;
    const queryString = network.explorer.queryString ?? '';

    return `${explorerUrl}${contractAddress}${queryString}`;
};
