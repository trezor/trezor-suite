import type { ExchangeKYCType } from 'invity-api';

import { Translation } from '@suite-native/intl';
import { exhaustive } from '@trezor/type-utils';

type KycPolicyWarningProps = {
    kycPolicyType: ExchangeKYCType | undefined;
};

const KYC_POLICY_WARNINGS = [
    'KYC-required',
    'KYC-norefund',
    'KYC-yesrefund',
] as const satisfies readonly ExchangeKYCType[];

type WarnedKycPolicyType = (typeof KYC_POLICY_WARNINGS)[number];

export const hasKycPolicyWarning = (
    kycPolicyType: ExchangeKYCType | undefined,
): kycPolicyType is WarnedKycPolicyType =>
    kycPolicyType !== undefined &&
    (KYC_POLICY_WARNINGS as readonly ExchangeKYCType[]).includes(kycPolicyType);

export const KycPolicyWarning = ({ kycPolicyType }: KycPolicyWarningProps) => {
    if (!hasKycPolicyWarning(kycPolicyType)) {
        return null;
    }

    switch (kycPolicyType) {
        case 'KYC-required':
            return <Translation id="moduleTrading.kyc.kycRequired" />;
        case 'KYC-norefund':
            return <Translation id="moduleTrading.kyc.noRefund" />;
        case 'KYC-yesrefund':
            return <Translation id="moduleTrading.kyc.yesRefund" />;
        default:
            return exhaustive(kycPolicyType);
    }
};
