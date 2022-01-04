import { State } from '../settingsReducer';

export default {
    localCurrency: 'usd',
    discreetMode: false,
    enabledNetworks: ['btc', 'ltc'],
    lastUsedFeeLevel: {},
    backends: {
        btc: {
            type: 'blockbook',
            urls: ['https://btc1.com', 'https://btc2.com'],
        },
        ltc: {
            type: 'blockbook',
            urls: ['https://ltc1.com', 'https://ltc2.com'],
        },
    },
} as State;
