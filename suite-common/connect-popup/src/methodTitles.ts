import { fromHardenedPathPart } from '@trezor/crypto-utils';

// The titles of host calls, worded as Connect worded them in its method info.

export const getNetworkLabel = (label: string, network?: { name: string }) => {
    if (network) {
        const name = network.name.toLowerCase().includes('testnet') ? 'Testnet' : network.name;

        return label.replace('#NETWORK', name);
    }

    return label.replace('#NETWORK', '');
};

export const getUniqueNetworks = <T extends { shortcut: string }>(networks: (T | undefined)[]) =>
    networks.reduce((result: T[], info?: T) => {
        if (!info || result.find(i => i.shortcut === info.shortcut)) return result;

        return result.concat(info);
    }, []);

// The account of a BIP44-like path, numbered from 1.
export const getAccountNumber = (path: number[]) => fromHardenedPathPart(path[2] ?? 0) + 1;
