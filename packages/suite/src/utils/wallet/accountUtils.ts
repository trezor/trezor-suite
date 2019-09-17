import l10nMessages from '@wallet-views/account/messages';
import { InjectedIntl } from 'react-intl';
import BigNumber from 'bignumber.js';
import { Account } from '@wallet-types';
import { NETWORKS } from '@suite-config';

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

export const getFiatValue = (amount: string, rate: string, fixedTo = 2) => {
    const fiatValueBigNumber = new BigNumber(amount).multipliedBy(new BigNumber(rate));
    const fiatValue = fiatValueBigNumber.isNaN() ? '' : fiatValueBigNumber.toFixed(fixedTo);

    return fiatValue;
};

export const getTitleForNetwork = (symbol: Account['symbol'], intl: InjectedIntl) => {
    switch (symbol.toLowerCase()) {
        case 'btc':
            return intl.formatMessage(l10nMessages.TR_NETWORK_BITCOIN);
        case 'test':
            return intl.formatMessage(l10nMessages.TR_NETWORK_BITCOIN_TESTNET);
        case 'bch':
            return intl.formatMessage(l10nMessages.TR_NETWORK_BITCOIN_CASH);
        case 'btg':
            return intl.formatMessage(l10nMessages.TR_NETWORK_BITCOIN_GOLD);
        case 'dash':
            return intl.formatMessage(l10nMessages.TR_NETWORK_DASH);
        case 'dgb':
            return intl.formatMessage(l10nMessages.TR_NETWORK_DIGIBYTE);
        case 'doge':
            return intl.formatMessage(l10nMessages.TR_NETWORK_DOGECOIN);
        case 'ltc':
            return intl.formatMessage(l10nMessages.TR_NETWORK_LITECOIN);
        case 'nmc':
            return intl.formatMessage(l10nMessages.TR_NETWORK_NAMECOIN);
        case 'vtc':
            return intl.formatMessage(l10nMessages.TR_NETWORK_VERTCOIN);
        case 'zec':
            return intl.formatMessage(l10nMessages.TR_NETWORK_ZCASH);
        case 'eth':
            return intl.formatMessage(l10nMessages.TR_NETWORK_ETHEREUM);
        case 'trop':
            return intl.formatMessage(l10nMessages.TR_NETWORK_ETHEREUM_TESTNET);
        case 'etc':
            return intl.formatMessage(l10nMessages.TR_NETWORK_ETHEREUM_CLASSIC);
        case 'xem':
            return intl.formatMessage(l10nMessages.TR_NETWORK_NEM);
        case 'xlm':
            return intl.formatMessage(l10nMessages.TR_NETWORK_STELLAR);
        case 'ada':
            return intl.formatMessage(l10nMessages.TR_NETWORK_CARDANO);
        case 'xtz':
            return intl.formatMessage(l10nMessages.TR_NETWORK_TEZOS);
        case 'xrp':
            return intl.formatMessage(l10nMessages.TR_NETWORK_XRP);
        case 'txrp':
            return intl.formatMessage(l10nMessages.TR_NETWORK_XRP_TESTNET);
        default:
            return intl.formatMessage(l10nMessages.TR_NETWORK_UNKNOWN);
    }
};

export const getTypeForNetwork = (accountType: Account['accountType'], intl: InjectedIntl) => {
    switch (accountType) {
        case 'normal':
            return null;
        case 'segwit':
            return intl.formatMessage(l10nMessages.TR_NETWORK_TYPE_SEGWIT);
        case 'legacy':
            return intl.formatMessage(l10nMessages.TR_NETWORK_TYPE_LEGACY);
        // no default
    }
};

export const formatAmount = (amount: string, symbol: string) => {
    const network = NETWORKS.find(n => n.symbol === symbol);
    if (!network) return amount;
    return new BigNumber(amount).div(10 ** network.decimals).toString(10);
};

// export const sortByCoin = (accounts: Account[]) => {
//     return accounts.sort((a, b) => {
//         const aIndex = NETWORKS.findIndex(
//             n => n.accountType === a.accountType && n.symbol === a.symbol,
//         );
//         const bIndex = NETWORKS.findIndex(
//             n => n.accountType === b.accountType && b.symbol === a.symbol,
//         );

//         if ()

//         return aIndex - bIndex;
//     });
// };
