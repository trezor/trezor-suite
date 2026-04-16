//  origin: https://github.com/trezor/connect/blob/develop/src/js/utils/accountUtils.js

import type { BitcoinNetworkInfo, CoinInfo } from '@trezor/connect-common';
import { ERRORS } from '@trezor/connect-common/src/constants';

import { fromHardened, toHardened } from './pathUtils';
import { getCoinName } from '../data/coinInfo';

type Bip44Options = {
    purpose?: number;
    coinType?: number;
};

export const getAccountAddressN = (
    coinInfo: CoinInfo,
    accountIndex: number,
    bip44?: Bip44Options,
) => {
    if (!coinInfo) {
        throw ERRORS.TypedError('Method_UnknownCoin');
    }
    const index = typeof accountIndex === 'number' ? accountIndex : 0;
    const options = {
        purpose: 44,
        coinType: coinInfo.slip44,
        ...bip44,
    };

    if (coinInfo.type === 'bitcoin') {
        return [toHardened(options.purpose), toHardened(options.coinType), toHardened(index)];
    }
    // see: https://github.com/cardano-foundation/CIPs/blob/master/CIP-1852/CIP-1852.md
    if (coinInfo.shortcut === 'ADA' || coinInfo.shortcut === 'tADA') {
        return [toHardened(1852), toHardened(options.coinType), toHardened(index)];
    }
    if (coinInfo.type === 'ethereum') {
        return [toHardened(options.purpose), toHardened(options.coinType), toHardened(0), 0, index];
    }
    if (coinInfo.shortcut === 'tXRP') {
        // FW bug: https://github.com/trezor/trezor-firmware/issues/321
        return [toHardened(options.purpose), toHardened(144), toHardened(index), 0, 0];
    }

    // TODO: cover all misc coins or throw error
    return [toHardened(options.purpose), toHardened(options.coinType), toHardened(index), 0, 0];
};

export const getAccountLabel = (path: number[], coinInfo: CoinInfo) => {
    if (coinInfo.type === 'bitcoin') {
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const path0: number = path[0];
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const path2: number = path[2];
        const accountType = fromHardened(path0);
        const account = fromHardened(path2);
        let prefix = '';

        if (accountType === 48) {
            prefix = 'multisig';
        } else if (accountType === 49 && coinInfo.segwit) {
            prefix = 'segwit';
        } else if (accountType === 44 && coinInfo.segwit) {
            prefix = 'legacy';
        }

        return `${prefix} account #${account + 1}`;
    }
    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    const path4: number = path[4];
    const account = fromHardened(path4);

    return `account #${account + 1}`;
};

export const getPublicKeyLabel = (path: number[], coinInfo?: BitcoinNetworkInfo) => {
    let hasSegwit = false;
    let coinLabel = 'Unknown coin';
    if (coinInfo) {
        coinLabel = coinInfo.label;
        hasSegwit = coinInfo.segwit;
    } else {
        coinLabel = getCoinName(path);
    }

    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    const pubKeyPath0: number = path[0];
    const p1 = fromHardened(pubKeyPath0);
    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    const pubKeyPath2: number = path[2];
    let account = path.length >= 3 ? fromHardened(pubKeyPath2) : -1;
    let realAccountId = account + 1;
    let prefix = 'Export public key';
    let accountType = '';

    // Copay id
    if (p1 === 45342) {
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const pubKeyPath1: number = path[1];
        const p2 = fromHardened(pubKeyPath1);
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const pubKeyPath3: number = path[3];
        account = fromHardened(pubKeyPath3);
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
