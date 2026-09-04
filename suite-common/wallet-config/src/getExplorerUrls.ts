import type { Explorer } from './types';

// `{} extends Pick<T, K>` is the canonical TS idiom for distinguishing required vs
// optional properties — it relies on {}'s "any non-nullish" semantics and cannot be
// expressed with Record<string, never>, which is strictly empty.
type RequiredKeys<T> = {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    [K in keyof T]-?: {} extends Pick<T, K> ? never : K;
}[keyof T];

type OptionalKeys<T> = {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
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
