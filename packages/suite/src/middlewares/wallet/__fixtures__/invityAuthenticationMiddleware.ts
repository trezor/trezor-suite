import type { AccountInfoResponse, InvityAuthentication } from '@wallet-types/invity';

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
    active: true,
};

export const ACCOUNT_INFO_RESOPONSE: AccountInfoResponse = {
    data: {
        buyTrades: [],
        exchangeTrades: [],
        sellTrades: [],
        id: 'FAKE',
        sessions: [],
        settings: {
            country: 'CZ',
            language: 'CZ',
            cryptoCurrency: 'BTC',
            fiatCurrency: 'EUR',
        },
    },
};
