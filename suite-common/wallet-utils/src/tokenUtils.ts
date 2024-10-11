import { NetworkSymbol } from '@suite-common/wallet-config';
import { parseAsset } from '@trezor/blockchain-link-utils/src/blockfrost';

export const getContractAddressForNetwork = (
    networkSymbol: NetworkSymbol,
    contractAddress: string,
) => {
    switch (networkSymbol) {
        case 'eth':
            // Specyfing most common network as first case improves performance little bit
            return contractAddress.toLowerCase();
        case 'sol':
        case 'dsol':
            return contractAddress;
        case 'ada':
        case 'tada':
            const { policyId } = parseAsset(contractAddress);

            return policyId.toLowerCase();
        default:
            return contractAddress.toLowerCase();
    }
};
