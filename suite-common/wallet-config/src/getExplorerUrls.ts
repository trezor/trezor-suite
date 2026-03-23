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

type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Pick<T, K> ? never : K;
}[keyof T];

type OptionalKeys<T> = {
    [K in keyof T]-?: {} extends Pick<T, K> ? K : never;
}[keyof T];

function getExplorerUrlSuffix<T, K extends RequiredKeys<T>>(obj: T, key: K): string;
function getExplorerUrlSuffix<T, K extends OptionalKeys<T>>(obj: T, key: K): string | undefined;

function getExplorerUrlSuffix<T, K extends keyof T>(obj: T, key: K): string | undefined {
    const value = obj[key];

    if (typeof value === 'string') {
        const slug = value.split('/');

        return slug[slug.length - 2];
    }

    return undefined;
}

export const getParsedExplorerUrls = (explorer: Explorer): Explorer => {
    const { base, queryString } = explorer;

    const tx = getExplorerUrlSuffix(explorer, 'tx');
    const address = getExplorerUrlSuffix(explorer, 'address');
    const nft = getExplorerUrlSuffix(explorer, 'nft');
    const token = getExplorerUrlSuffix(explorer, 'token');

    return { base, tx, address, nft, token, queryString };
};

export const getExplorerUrl = (explorer: Explorer | undefined, key: keyof Explorer) => {
    if (!explorer) {
        return undefined;
    }

    return `${explorer.base}/${explorer[key]}/`;
};
