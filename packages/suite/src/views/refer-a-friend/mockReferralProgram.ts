// Placeholder program values until the referral API is available.
export const mockReferralProgram = {
    fiatCurrency: 'USD',
    rewardAmount: 20,
    minimumOrderAmount: 49,
    friendDiscountPercentage: 10,
    annualReferralLimit: 50,
    annualRewardLimit: 1000,
    rewardWaitingPeriodDays: 30,
    referralLink: 'https://trezor.io/ref/a3k9x2m7',
    nextResetDate: '2027-08-31',
    voucherExpirationDate: '2027-08-31',
} as const;

export type ReferralVoucher = { id: number } & (
    | { status: 'pending'; availableInDays: number }
    | { status: 'ready' | 'expired'; code: string; expiresAt: string }
    | { status: 'used' | 'canceled'; code: string }
);

export const mockReferralVouchers: ReferralVoucher[] = [
    {
        id: 1,
        status: 'ready',
        code: 'TREF-8K2M-X9P4',
        expiresAt: mockReferralProgram.voucherExpirationDate,
    },
    {
        id: 2,
        status: 'ready',
        code: 'TREF-2P8R-N6Y3',
        expiresAt: mockReferralProgram.voucherExpirationDate,
    },
    {
        id: 3,
        status: 'ready',
        code: 'TREF-6H5J-K2W9',
        expiresAt: mockReferralProgram.voucherExpirationDate,
    },
    { id: 4, status: 'pending', availableInDays: 5 },
    { id: 5, status: 'used', code: 'TREF-4B7D-R5Q2' },
    { id: 6, status: 'canceled', code: 'TREF-9C3F-M8L6' },
    { id: 7, status: 'expired', code: 'TREF-7N2V-P4S8', expiresAt: '2026-06-30' },
];

export const mockReferralScenarios = {
    allStates: mockReferralVouchers,
    empty: [],
    limitReached: Array.from({ length: mockReferralProgram.annualReferralLimit }, (_, index) => ({
        id: index + 1,
        status: 'ready' as const,
        code: `TREF-MOCK-${String(index + 1).padStart(4, '0')}`,
        expiresAt: mockReferralProgram.voucherExpirationDate,
    })),
} satisfies Record<string, ReferralVoucher[]>;
