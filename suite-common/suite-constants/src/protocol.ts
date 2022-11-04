import { NetworkSymbol } from '@suite-common/wallet-config';

export enum PROTOCOL_SCHEME {
    BITCOIN = 'bitcoin',
    LITECOIN = 'litecoin',
    BITCOIN_CASH = 'bitcoincash',
    BITCOIN_GOLD = 'bitcoingold',
    DASH = 'dash',
    DIGIBYTE = 'digibyte',
    DOGECOIN = 'dogecoin',
    NAMECOIN = 'namecoin',
    VERTCOIN = 'vertcoin',
    ZCASH = 'zcash',
    // only bitcoin-like coins are supported in uri handler, others are required for QR code scan
    ETHEREUM = 'ethereum',
    ETHEREUM_CLASSIC = 'ethclassic',
    XRP = 'ripple',
    CARDANO = 'cardano',
}

export const PROTOCOL_TO_NETWORK: Partial<{ [key in PROTOCOL_SCHEME]: NetworkSymbol }> = {
    [PROTOCOL_SCHEME.BITCOIN]: 'btc',
    [PROTOCOL_SCHEME.LITECOIN]: 'ltc',
    [PROTOCOL_SCHEME.BITCOIN_CASH]: 'bch',
    [PROTOCOL_SCHEME.BITCOIN_GOLD]: 'btg',
    [PROTOCOL_SCHEME.DASH]: 'dash',
    [PROTOCOL_SCHEME.DIGIBYTE]: 'dgb',
    [PROTOCOL_SCHEME.DOGECOIN]: 'doge',
    [PROTOCOL_SCHEME.NAMECOIN]: 'nmc',
    [PROTOCOL_SCHEME.VERTCOIN]: 'vtc',
    [PROTOCOL_SCHEME.ZCASH]: 'zec',
    [PROTOCOL_SCHEME.ETHEREUM]: 'eth',
    [PROTOCOL_SCHEME.ETHEREUM_CLASSIC]: 'etc',
    [PROTOCOL_SCHEME.XRP]: 'xrp',
    [PROTOCOL_SCHEME.CARDANO]: 'ada',
};
