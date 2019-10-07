import BigNumber from 'bignumber.js';
import l10nMessages from '@wallet-views/account/messages';
import { Account } from '@wallet-types';
import { NETWORKS } from '@wallet-config';

export const parseBIP44Path = (path: string) => {
    const regEx = /m\/(\d+'?)\/(\d+'?)\/(\d+'?)\/([0,1])\/(\d+)/;
    const tokens = path.match(regEx);
    if (!tokens || tokens.length !== 6) {
        return null;
    }

    return {
        purpose: tokens[1],
        coinType: tokens[2],
        account: tokens[3],
        change: tokens[4],
        addrIndex: tokens[5],
    };
};

export const getTitleForNetwork = (symbol: Account['symbol']) => {
    switch (symbol.toLowerCase()) {
        case 'btc':
            return l10nMessages.TR_NETWORK_BITCOIN;
        case 'test':
            return l10nMessages.TR_NETWORK_BITCOIN_TESTNET;
        case 'bch':
            return l10nMessages.TR_NETWORK_BITCOIN_CASH;
        case 'btg':
            return l10nMessages.TR_NETWORK_BITCOIN_GOLD;
        case 'dash':
            return l10nMessages.TR_NETWORK_DASH;
        case 'dgb':
            return l10nMessages.TR_NETWORK_DIGIBYTE;
        case 'doge':
            return l10nMessages.TR_NETWORK_DOGECOIN;
        case 'ltc':
            return l10nMessages.TR_NETWORK_LITECOIN;
        case 'nmc':
            return l10nMessages.TR_NETWORK_NAMECOIN;
        case 'vtc':
            return l10nMessages.TR_NETWORK_VERTCOIN;
        case 'zec':
            return l10nMessages.TR_NETWORK_ZCASH;
        case 'eth':
            return l10nMessages.TR_NETWORK_ETHEREUM;
        case 'trop':
            return l10nMessages.TR_NETWORK_ETHEREUM_TESTNET;
        case 'etc':
            return l10nMessages.TR_NETWORK_ETHEREUM_CLASSIC;
        case 'xem':
            return l10nMessages.TR_NETWORK_NEM;
        case 'xlm':
            return l10nMessages.TR_NETWORK_STELLAR;
        case 'ada':
            return l10nMessages.TR_NETWORK_CARDANO;
        case 'xtz':
            return l10nMessages.TR_NETWORK_TEZOS;
        case 'xrp':
            return l10nMessages.TR_NETWORK_XRP;
        case 'txrp':
            return l10nMessages.TR_NETWORK_XRP_TESTNET;
        default:
            return l10nMessages.TR_NETWORK_UNKNOWN;
    }
};

export const getTypeForNetwork = (accountType: Account['accountType']) => {
    switch (accountType) {
        case 'normal':
            return null;
        case 'segwit':
            return l10nMessages.TR_NETWORK_TYPE_SEGWIT;
        case 'legacy':
            return l10nMessages.TR_NETWORK_TYPE_LEGACY;
        // no default
    }
};

export const getFiatValue = (amount: string, rate: string, fixedTo = 2) => {
    const fiatValueBigNumber = new BigNumber(amount).multipliedBy(new BigNumber(rate));
    const fiatValue = fiatValueBigNumber.isNaN() ? '' : fiatValueBigNumber.toFixed(fixedTo);

    return fiatValue;
};

export const formatAmount = (amount: string, decimals: number) => {
    try {
        const bAmount = new BigNumber(amount);
        if (bAmount.isNaN()) {
            throw new Error('Amount is not a number');
        }
        return bAmount.div(10 ** decimals).toString(10);
    } catch (error) {
        return '-1';
    }
};

export const networkAmountToSatoshi = (amount: string, symbol: Account['symbol']) => {
    const network = NETWORKS.find(n => n.symbol === symbol);
    if (!network) return amount;
    try {
        const bAmount = new BigNumber(amount);
        if (bAmount.isNaN()) {
            throw new Error('Amount is not a number');
        }
        return bAmount.times(10 ** network.decimals).toString(10);
    } catch (error) {
        return '-1';
    }
};

export const formatNetworkAmount = (amount: string, symbol: Account['symbol']) => {
    const network = NETWORKS.find(n => n.symbol === symbol);
    if (!network) return amount;
    return formatAmount(amount, network.decimals);
};

export const sortByCoin = (accounts: Account[]) => {
    return accounts.sort((a, b) => {
        const aIndex = NETWORKS.findIndex(n => {
            const accountType = n.accountType || 'normal';
            return accountType === a.accountType && n.symbol === a.symbol;
        });
        const bIndex = NETWORKS.findIndex(n => {
            const accountType = n.accountType || 'normal';
            return accountType === b.accountType && n.symbol === b.symbol;
        });
        if (aIndex === bIndex) return a.index - b.index;
        return aIndex - bIndex;
    });
};
