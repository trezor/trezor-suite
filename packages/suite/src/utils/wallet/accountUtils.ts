import l10nMessages from '@wallet-views/account/messages';
import { InjectedIntl } from 'react-intl';

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

export const getTitleForNetwork = (symbol: string, intl: InjectedIntl) => {
    switch (symbol.toLowerCase()) {
        case 'btc':
            return intl.formatMessage(l10nMessages.TR_NETWORK_BITCOIN);
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
        default:
            return intl.formatMessage(l10nMessages.TR_NETWORK_UNKNOWN);
    }
};
