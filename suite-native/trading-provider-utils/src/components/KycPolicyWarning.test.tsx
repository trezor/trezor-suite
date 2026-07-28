import type { ExchangeKYCType } from 'invity-api';

import { Text } from '@suite-native/atoms';
import { renderWithBasicProvider } from '@suite-native/test-utils';

import { KycPolicyWarning, hasKycPolicyWarning } from './KycPolicyWarning';

describe('KycPolicyWarning', () => {
    it.each([
        {
            kycPolicyType: 'KYC-required' as const,
            expected: 'KYC is required.',
        },
        {
            kycPolicyType: 'KYC-norefund' as const,
            expected: 'KYC is only required in exceptional cases. It may be needed for refunds.',
        },
        {
            kycPolicyType: 'KYC-yesrefund' as const,
            expected: "KYC is only required in exceptional cases. It's not needed for refunds.",
        },
    ])('renders correct translation for $kycPolicyType', ({ kycPolicyType, expected }) => {
        const { getByText } = renderWithBasicProvider(
            <Text>
                <KycPolicyWarning kycPolicyType={kycPolicyType} />
            </Text>,
        );

        expect(getByText(expected)).toBeTruthy();
    });

    it.each([
        { kycPolicyType: 'noKYC' as const },
        { kycPolicyType: undefined },
        { kycPolicyType: 'UNKNOWN_TYPE' as ExchangeKYCType },
    ])('renders nothing for $kycPolicyType', ({ kycPolicyType }) => {
        const { queryByText } = renderWithBasicProvider(
            <Text>
                <KycPolicyWarning kycPolicyType={kycPolicyType} />
            </Text>,
        );

        expect(queryByText(/./)).toBeNull();
    });
});

describe('hasKycPolicyWarning', () => {
    it.each<ExchangeKYCType>(['KYC-required', 'KYC-norefund', 'KYC-yesrefund'])(
        'returns true for %s',
        kycPolicyType => {
            expect(hasKycPolicyWarning(kycPolicyType)).toBe(true);
        },
    );

    it.each(['noKYC' as const, 'DEX' as const, 'UNKNOWN' as ExchangeKYCType, undefined])(
        'returns false for %s',
        kycPolicyType => {
            expect(hasKycPolicyWarning(kycPolicyType)).toBe(false);
        },
    );
});
