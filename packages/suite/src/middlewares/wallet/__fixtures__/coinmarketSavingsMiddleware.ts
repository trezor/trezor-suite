import { InvityAuthentication } from '@wallet-types/invity';

export const ACCOUNT = {
    descriptor: 'btc-descriptor',
    symbol: 'btc',
    index: 0,
    accountType: 'normal',
};

export const INVITY_AUTHENTICATION: InvityAuthentication = {
    accountInfo: {
        settings: {
            country: 'CZ',
            language: 'CZ',
            cryptoCurrency: 'BTC',
            fiatCurrency: 'EUR',
        },
        id: 'FakeId',
        buyTrades: [],
        exchangeTrades: [],
        sellTrades: [],
        sessions: [],
    },
    identity: {
        id: 'FAKE',
        traits: {
            email: 'FAKE@FAKE.FAKE',
        },
        verifiable_addresses: [
            {
                verified: true,
            },
        ],
    },
};

export const SELECTED_PROVIDER = {
    isClientFromUnsupportedCountry: false,
    name: '',
    companyName: '',
    logo: '',
    isActive: true,
    tradedCoins: [],
    supportedCountries: [],
    identityDocuments: [],
    privacyPolicyUrl: '',
};
