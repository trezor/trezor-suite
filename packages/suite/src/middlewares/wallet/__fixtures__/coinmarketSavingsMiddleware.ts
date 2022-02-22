import type { SavingsProviderInfo } from '@suite-services/invityAPI';
import type { InvityAuthentication } from '@wallet-types/invity';

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
        savingsTrades: [],
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

export const SELECTED_PROVIDER: SavingsProviderInfo = {
    isClientFromUnsupportedCountry: false,
    name: '',
    companyName: '',
    logo: '',
    isActive: true,
    tradedCoins: [],
    supportedCountries: [],
    identityDocuments: [],
    privacyPolicyUrl: '',
    flow: {
        afterLogin: {
            isEnabled: false,
        },
        aml: {
            isEnabled: false,
        },
        bankAccount: {
            isEnabled: false,
        },
        credentials: {
            isEnabled: false,
            isFamilyNameEnabled: false,
            isGivenNameEnabled: false,
            isPhoneEnabled: false,
        },
        cryptoWalletVerification: {
            isEnabled: false,
        },
        kyc: {
            documentUploadType: 'ClientApp',
            isEnabled: false,
            isWaitingForKYCResult: false,
        },
        parameters: {
            isEnabled: false,
            receivingAddressCount: 1,
        },
        phoneVerification: {
            isEnabled: false,
        },
    },
};
