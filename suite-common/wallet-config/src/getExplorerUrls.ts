import { Explorer, NetworkType } from './types';

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
            account: `${baseUrl}/xpub/`,
            address: `${baseUrl}/address/`,
        },
        ethereum: {
            base: baseUrl,
            tx: `${baseUrl}/tx/`,
            account: `${baseUrl}/address/`,
            address: `${baseUrl}/address/`,
            nft: `${baseUrl}/nft/`,
        },
        ripple: {
            base: baseUrl,
            tx: `${baseUrl}/tx/`,
            account: `${baseUrl}/account/`,
            address: `${baseUrl}/account/`,
        },
        solana: {
            base: baseUrl,
            tx: `${baseUrl}/tx/`,
            account: `${baseUrl}/account/`,
            address: `${baseUrl}/account/`,
            queryString: solanaDevnet ? `?cluster=devnet` : '',
        },
        cardano: {
            base: baseUrl,
            tx: `${baseUrl}/tx/`,
            account: `${baseUrl}/address/`,
            address: `${baseUrl}/address/`,
            token: `${baseUrl}/asset/`,
        },
    };

    return networkTypeExplorerMap[networkType];
};

export const getExplorerUrlsRaw = (
    baseUrl: string,
    networkType: NetworkType,
    queryString?: string,
): Explorer => {
    const networkTypeExplorerMap: NetworkTypeExplorerMap = {
        bitcoin: {
            base: baseUrl,
            tx: 'tx',
            account: 'xpub',
            address: 'address',
        },
        ethereum: {
            base: baseUrl,
            tx: 'tx',
            account: 'address',
            address: 'address',
            nft: 'nft',
        },
        ripple: {
            base: baseUrl,
            tx: 'tx',
            account: 'account',
            address: 'account',
        },
        solana: {
            base: baseUrl,
            tx: 'tx',
            account: 'account',
            address: 'account',
            queryString: queryString ?? '',
        },
        cardano: {
            base: baseUrl,
            tx: 'tx',
            account: 'address',
            address: 'address',
            token: 'asset',
        },
    };

    return networkTypeExplorerMap[networkType];
};

export const getExplorerUrl = (explorer: Explorer | undefined, key: keyof Explorer) => {
    if (!explorer) {
        return undefined;
    }

    return `${explorer.base}/${explorer[key]}/`;
};
