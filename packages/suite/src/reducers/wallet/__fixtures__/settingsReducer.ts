import { State } from '../settingsReducer';

export default {
    localCurrency: 'usd',
    discreetMode: false,
    enabledNetworks: ['btc', 'ltc'],
    lastUsedFeeLevel: {},
    blockbookUrls: [
        {
            coin: 'btc',
            url: 'https://btc1.com',
        },
        {
            coin: 'btc',
            url: 'https://btc2.com',
        },
        {
            coin: 'ltc',
            url: 'https://ltc1.com',
        },
        {
            coin: 'ltc',
            url: 'https://ltc2.com',
        },
    ],
} as State;
