import { ExchangeKYCType } from 'invity-api';

import { Translation } from '@suite-native/intl';

export const getKycPolicyWarningTranslation = (kycPolicyType: ExchangeKYCType | undefined) => {
    switch (kycPolicyType) {
        case 'KYC-required':
            return <Translation id="moduleTrading.kyc.kycRequired" />;

        case 'KYC-norefund':
            return <Translation id="moduleTrading.kyc.noRefund" />;

        case 'KYC-yesrefund':
            return <Translation id="moduleTrading.kyc.yesRefund" />;

        default:
            return null;
    }
};
