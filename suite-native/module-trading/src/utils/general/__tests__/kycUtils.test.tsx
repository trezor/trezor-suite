import type { ExchangeKYCType } from 'invity-api';

import { Text } from '@suite-native/atoms';
import { renderWithProviders } from '@suite-native/test-utils';

import { getKycPolicyWarningTranslation } from '../kycUtils';

describe('getKycPolicyWarningTranslation', () => {
    const renderTextWithTranslation = (type: ExchangeKYCType | undefined) => {
        const component = getKycPolicyWarningTranslation(type);
        if (!component) return null;

        return renderWithProviders(<Text>{component}</Text>, { providers: ['intl'] });
    };

    it.each([
        {
            kycPolicyType: 'KYC-required' as const,
            expected: 'This provider requires to verify identity.',
        },
        {
            kycPolicyType: 'KYC-norefund' as const,
            expected: 'KYC is only requested in exceptional cases. KYC required for refunds.',
        },
        {
            kycPolicyType: 'KYC-yesrefund' as const,
            expected: "KYC is only requested in exceptional cases. It's not required for refunds.",
        },
    ])('should return correct translation for $kycPolicyType', ({ kycPolicyType, expected }) => {
        const result = renderTextWithTranslation(kycPolicyType);

        expect(result).toBeTruthy();
        expect(result?.getByText(expected)).toBeTruthy();
    });

    it.each([
        { kycPolicyType: 'noKYC' as const },
        { kycPolicyType: undefined },
        { kycPolicyType: 'UNKNOWN_TYPE' as any },
    ])('should return null for $kycPolicyType', ({ kycPolicyType }) => {
        const component = getKycPolicyWarningTranslation(kycPolicyType);

        expect(component).toBeNull();
    });
});
