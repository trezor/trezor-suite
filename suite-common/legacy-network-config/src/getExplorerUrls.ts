import { type Explorer, type NetworkType } from './types';

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
            base: baseUrl,
            tx: `${baseUrl}/tx/`,
            address: `${baseUrl}/address/`,
        },
        ethereum: {
            base: baseUrl,
            tx: `${baseUrl}/tx/`,
            address: `${baseUrl}/address/`,
            nft: `${baseUrl}/nft/`,
        },
        tron: {
            base: baseUrl,
            tx: `${baseUrl}/transaction/`,
            address: `${baseUrl}/address/`,
            nft: `${baseUrl}/contract/`, // should be trc721, trc1155 instead of contract
            token: `${baseUrl}/contract/`, // should be trc10, trc20 instead of contract
        },
        ripple: {
            base: baseUrl,
            tx: `${baseUrl}/tx/`,
            address: `${baseUrl}/account/`,
        },
        solana: {
            base: baseUrl,
            tx: `${baseUrl}/tx/`,
            address: `${baseUrl}/account/`,
            queryString: solanaDevnet ? `?cluster=devnet` : '',
        },
        cardano: {
            base: baseUrl,
            tx: `${baseUrl}/tx/`,
            address: `${baseUrl}/address/`,
            token: `${baseUrl}/asset/`,
        },
        stellar: {
            base: baseUrl,
            tx: `${baseUrl}/tx/`,
            address: `${baseUrl}/account/`,
            token: `${baseUrl}/asset/`,
        },
    };

    return networkTypeExplorerMap[networkType];
};
