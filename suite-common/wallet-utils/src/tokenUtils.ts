import { Network, NetworkSymbol } from '@suite-common/wallet-config';
import { TokenInfo } from '@trezor/blockchain-link-types';
import { parseAsset } from '@trezor/blockchain-link-utils/src/blockfrost';

export const getContractAddressForNetworkSymbol = (
    symbol: NetworkSymbol | (string & {}), // unknown symbols will result to lowerCase
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
