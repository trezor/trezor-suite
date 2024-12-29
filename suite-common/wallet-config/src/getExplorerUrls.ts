import { NetworkType, Explorer } from './types';

type NetworkTypeExplorerMap = {
    [key in NetworkType]: Explorer;
};

export const getExplorerUrls = (
    baseUrl: string,
    networkType: NetworkType,
    solanaDevnet?: boolean,
): Explorer => {
    const networkTypeExplorerMap: NetworkTypeExplorerMap = {
        bitcoin: {
            tx: `${baseUrl}/tx/`,
            account: `${baseUrl}/xpub/`,
            address: `${baseUrl}/address/`,
        },
        ethereum: {
            tx: `${baseUrl}/tx/`,
            account: `${baseUrl}/address/`,
            address: `${baseUrl}/address/`,
            nft: `${baseUrl}/nft/`,
        },
        ripple: {
            tx: `${baseUrl}/tx/`,
            account: `${baseUrl}/account/`,
            address: `${baseUrl}/account/`,
        },
        solana: {
            tx: `${baseUrl}/tx/`,
            account: `${baseUrl}/account/`,
            address: `${baseUrl}/account/`,
            queryString: solanaDevnet ? `?cluster=devnet` : '',
        },
        cardano: {
            tx: `${baseUrl}/tx/`,
            account: `${baseUrl}/address/`,
            address: `${baseUrl}/address/`,
            token: `${baseUrl}/asset/`,
        },
    };

    return networkTypeExplorerMap[networkType];
};
