// Shapes follow the Refer a Friend API. Kept local, so the mock server does not depend on Suite.

export type MockReferralProgram = {
    fiatCurrency: string;
    rewardAmount: number;
    friendDiscountPercentage: number;
    minimumOrderAmount: number;
    redemptionLimit: number;
    termsUrl: string;
};

export type MockReferralVoucher = {
    voucher: string | null;
    status: 'pending' | 'ready' | 'used' | 'expired' | 'canceled';
    amount: number;
    fiatCurrency: string;
    orderPaidAt: string;
    readyAt: string;
    expiresAt: string | null;
    usedAt: string | null;
};

export const mockReferralProgram: MockReferralProgram = {
    fiatCurrency: 'USD',
    rewardAmount: 20,
    friendDiscountPercentage: 10,
    minimumOrderAmount: 49,
    redemptionLimit: 50,
    termsUrl: 'https://trezor.io/terms-of-use#refer-a-friend',
};

export const MOCK_REDEMPTION_LIMIT_RESETS_AT = '2027-08-31';

const VOUCHER_EXPIRES_AT = '2027-08-31T00:00:00Z';

const DAY_MS = 24 * 60 * 60 * 1000;

const getDateInDays = (days: number) => new Date(Date.now() + days * DAY_MS).toISOString();

const createVoucher = (
    voucher: Pick<MockReferralVoucher, 'voucher' | 'status'> & Partial<MockReferralVoucher>,
): MockReferralVoucher => ({
    amount: mockReferralProgram.rewardAmount,
    fiatCurrency: mockReferralProgram.fiatCurrency,
    orderPaidAt: '2026-07-01T15:30:00Z',
    readyAt: '2026-08-05T00:00:00Z',
    expiresAt: null,
    usedAt: null,
    ...voucher,
});

const getAllStatesVouchers = () => [
    createVoucher({ voucher: 'TREF-8K2M-X9P4', status: 'ready', expiresAt: VOUCHER_EXPIRES_AT }),
    createVoucher({
        voucher: 'TREF-2P8R-N6Y3',
        status: 'ready',
        amount: 25,
        expiresAt: VOUCHER_EXPIRES_AT,
    }),
    createVoucher({ voucher: 'TREF-6H5J-K2W9', status: 'ready', expiresAt: VOUCHER_EXPIRES_AT }),
    createVoucher({
        voucher: null,
        status: 'pending',
        orderPaidAt: getDateInDays(-30),
        readyAt: getDateInDays(5),
    }),
    createVoucher({
        voucher: 'TREF-4B7D-R5Q2',
        status: 'used',
        expiresAt: VOUCHER_EXPIRES_AT,
        usedAt: '2026-08-20T10:00:00Z',
    }),
    createVoucher({ voucher: 'TREF-9C3F-M8L6', status: 'canceled' }),
    createVoucher({
        voucher: 'TREF-7N2V-P4S8',
        status: 'expired',
        expiresAt: '2026-06-30T00:00:00Z',
    }),
];

const getLimitReachedVouchers = () =>
    Array.from({ length: mockReferralProgram.redemptionLimit }, (_, index) =>
        createVoucher({
            voucher: `TREF-MOCK-${String(index + 1).padStart(4, '0')}`,
            status: 'ready',
            expiresAt: VOUCHER_EXPIRES_AT,
        }),
    );

export const mockReferralScenarios = {
    allStates: getAllStatesVouchers,
    empty: (): MockReferralVoucher[] => [],
    limitReached: getLimitReachedVouchers,
    // Error scenarios answer every signed endpoint with the error.
    rateLimited: getAllStatesVouchers,
    timestampExpired: getAllStatesVouchers,
} satisfies Record<string, () => MockReferralVoucher[]>;

export type MockReferralScenario = keyof typeof mockReferralScenarios;

export const isMockReferralScenario = (value: string): value is MockReferralScenario =>
    Object.keys(mockReferralScenarios).includes(value);
