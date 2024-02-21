import type { SavingsProviderInfo } from 'invity-api';

export const FIAT_AMOUNT = '100';
export const USD_BITCOIN_PRICE = 54321;

export const SELECTED_PROVIDER: SavingsProviderInfo = {
    companyName: 'FAKE',
    name: 'FAKE',
    defaultPaymentAmount: 0,
    defaultPaymentFrequency: 'Weekly',
    flow: {
        afterLogin: {
            isEnabled: false,
        },
        afterSuccessfulPhoneVerification: {
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
            isAutomaticPaymentPlanningEnabled: false,
            showReceivingAddressChangePaymentInfo: false,
            coinTransferDelayed: false,
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
