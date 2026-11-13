//  origin: https://github.com/trezor/connect/blob/develop/src/js/utils/accountUtils.js

import type { BitcoinNetworkInfo, CoinInfo } from '@trezor/connect-common';
import { fromHardenedPathPart } from '@trezor/crypto-utils';

import { getCoinInfoOfPath, getCoinName } from '../data/coinInfo';

// `crossChain` derives a key at a path outside `coinInfo` and serialises it in `coinInfo`'s format,
// and the permission names the network of the path (`getCoinInfoOfPath`).
// The dialog title names both, so that the user does not read "Export Bitcoin address" under an
// "Ethereum" permission heading.
export const getLabelWithPathNetwork = (
    label: string,
    path: number[],
    coinInfo: Readonly<BitcoinNetworkInfo>,
) => {
    const pathNetwork = getCoinInfoOfPath(path, coinInfo);

    return pathNetwork.shortcut === coinInfo.shortcut
        ? label
        : `${label} (${pathNetwork.name} path)`;
};

export const getPublicKeyLabel = (path: number[], coinInfo?: BitcoinNetworkInfo) => {
    let hasSegwit = false;
    let coinLabel: string;
    if (coinInfo) {
        coinLabel = coinInfo.label;
        hasSegwit = coinInfo.segwit;
    } else {
        coinLabel = getCoinName(path);
    }

    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    const pubKeyPath0: number = path[0];
    const p1 = fromHardenedPathPart(pubKeyPath0);
    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    const pubKeyPath2: number = path[2];
    let account = path.length >= 3 ? fromHardenedPathPart(pubKeyPath2) : -1;
    let realAccountId = account + 1;
    let prefix = 'Export public key';
    let accountType = '';

    // Copay id
    if (p1 === 45342) {
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const pubKeyPath1: number = path[1];
        const p2 = fromHardenedPathPart(pubKeyPath1);
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const pubKeyPath3: number = path[3];
        account = fromHardenedPathPart(pubKeyPath3);
        realAccountId = account + 1;
        prefix = 'Export Copay ID of';
        if (p2 === 48) {
            accountType = 'multisig';
        } else if (p2 === 44) {
            accountType = 'legacy';
        }
    } else if (p1 === 48) {
        accountType = `${coinLabel} multisig`;
    } else if (p1 === 44 && hasSegwit) {
        accountType = `${coinLabel} legacy`;
    } else if (p1 === 84 && hasSegwit) {
        accountType = `${coinLabel} native segwit`;
    } else {
        accountType = coinLabel;
    }

    if (realAccountId > 0) {
        return `${prefix} of ${accountType} account #${realAccountId}`;
    }

    return prefix;
};

export const isUtxoBased = (coinInfo: CoinInfo) =>
    coinInfo.type === 'bitcoin' || coinInfo.shortcut === 'ADA' || coinInfo.shortcut === 'tADA';
