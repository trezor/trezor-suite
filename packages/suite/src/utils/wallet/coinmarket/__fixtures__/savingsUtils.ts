import type { SavingsProviderInfo } from '@suite-services/invityAPI';
import { CurrentFiatRates } from '@wallet-types/fiatRates';

export const FIAT_RATES: CurrentFiatRates = {
    ts: 0,
    symbol: 'BTC',
    rates: {
        usd: 54321,
    },
};

export const SELECTED_PROVIDER: SavingsProviderInfo = {
    companyName: 'FAKE',
    name: 'FAKE',
    defaultPaymentAmount: 0,
    defaultPaymentFrequency: 'Weekly',
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
            isEnabled: false,
            documentUploadType: 'ClientApp',
            isWaitingForKYCResult: false,
        },
        parameters: {
            isEnabled: false,
            receivingAddressCount: 0,
        },
        paymentInfo: {
            isEnabled: false,
        },
        phoneVerification: {
            isEnabled: false,
            phoneVerificationType: 'ClientApp',
        },
    },
    identityDocuments: [],
    isActive: false,
    logo: 'FAKE',
    maximumPaymentAmountLimit: 0,
    minimumPaymentAmountLimit: 0,
    privacyPolicyUrl: 'FAKE',
    setupPaymentAmounts: [],
    supportedCountries: [],
    tradedCoins: [],
    tradedFiatCurrencies: [],
    setupPaymentFrequencies: [],
};
