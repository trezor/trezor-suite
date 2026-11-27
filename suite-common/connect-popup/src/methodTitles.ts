import type { BitcoinNetworkInfo, CoinInfo } from '@trezor/connect';
import { fromHardenedPathPart } from '@trezor/crypto-utils';
import { BigNumber } from '@trezor/utils';

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

export const formatAmount = (amount: string, coinInfo: CoinInfo) =>
    `${new BigNumber(amount).div(10 ** coinInfo.decimals).toString(10)} ${coinInfo.shortcut}`;

// The account of a BIP44-like path, numbered from 1.
export const getAccountNumber = (path: number[]) => fromHardenedPathPart(path[2] ?? 0) + 1;

type GetPublicKeyLabelParams = {
    path: number[];
    coinInfo?: BitcoinNetworkInfo;
    // Names a path of no bitcoin network.
    coinName: string;
};

export const getPublicKeyLabel = ({ path, coinInfo, coinName }: GetPublicKeyLabelParams) => {
    const coinLabel = coinInfo ? coinInfo.label : coinName;
    const hasSegwit = !!coinInfo?.segwit;
    const purpose = fromHardenedPathPart(path[0] ?? 0);
    let account = path.length >= 3 ? fromHardenedPathPart(path[2] ?? 0) : -1;
    let prefix = 'Export public key';
    let accountType = '';

    // Copay id
    if (purpose === 45342) {
        const copayPurpose = fromHardenedPathPart(path[1] ?? 0);
        account = fromHardenedPathPart(path[3] ?? 0);
        prefix = 'Export Copay ID';
        if (copayPurpose === 48) {
            accountType = 'multisig';
        } else if (copayPurpose === 44) {
            accountType = 'legacy';
        }
    } else if (purpose === 48) {
        accountType = `${coinLabel} multisig`;
    } else if (purpose === 44 && hasSegwit) {
        accountType = `${coinLabel} legacy`;
    } else if (purpose === 84 && hasSegwit) {
        accountType = `${coinLabel} native segwit`;
    } else {
        accountType = coinLabel;
    }

    if (account + 1 > 0) {
        return `${prefix} of ${accountType} account #${account + 1}`;
    }

    return prefix;
};
