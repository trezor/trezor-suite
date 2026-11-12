import { mockStakingPosition, mockStakingProductInfo } from '../../mocks';
import { stakingAmountSchema } from '../stakingAmount';
import {
    getStakingPositionAmount,
    getStakingPositionPrincipal,
    getStakingPositionRate,
    hasPendingStakingOperation,
    isStakingPositionActive,
} from './stakingPositionUtils';
import { stakingProviderIdSchema } from '../stakingProvider';

const amount = (value: string) => stakingAmountSchema.parse(value);

const balances = (overrides: Partial<ReturnType<typeof mockStakingPosition>['balances']>) => ({
    staked: amount('0'),
    pending: amount('0'),
    unstaking: amount('0'),
    withdrawable: amount('0'),
    rewards: amount('0'),
    ...overrides,
});

describe('getStakingPositionAmount', () => {
    it('adds the staked, pending, unstaking and withdrawable amounts', () => {
        const position = mockStakingPosition({
            balances: balances({
                staked: amount('2000000000000000000'),
                pending: amount('250000000000000000'),
                unstaking: amount('500000000000000000'),
                withdrawable: amount('100000000000000000'),
                rewards: amount('12000000000000000'),
            }),
        });

        expect(getStakingPositionAmount(position)).toBe('2850000000000000000');
    });

    it('is zero for an empty position', () => {
        expect(getStakingPositionAmount(mockStakingPosition({ balances: balances({}) }))).toBe('0');
    });
});

describe('getStakingPositionPrincipal', () => {
    const position = mockStakingPosition({
        balances: balances({
            staked: amount('2050000000000000000'),
            rewards: amount('50000000000000000'),
        }),
    });

    it('takes the rewards out of the stake when they compound into it', () => {
        expect(getStakingPositionPrincipal(position, 'compounded')).toBe('2000000000000000000');
    });

    it.each(['claimable', 'expected'] as const)('is the stake when rewards are %s', rewardsKind => {
        expect(getStakingPositionPrincipal(position, rewardsKind)).toBe('2050000000000000000');
    });

    it('is never negative', () => {
        const rewardsOnly = mockStakingPosition({
            balances: balances({ rewards: amount('50000000000000000') }),
        });

        expect(getStakingPositionPrincipal(rewardsOnly, 'compounded')).toBe('0');
    });
});

describe('isStakingPositionActive', () => {
    const inactive = mockStakingPosition({
        status: 'inactive',
        balances: balances({}),
        operations: ['stake'],
    });

    it('is false for an inactive position that only offers stake', () => {
        expect(isStakingPositionActive(inactive)).toBe(false);
    });

    it.each(['activating', 'active', 'deactivating'] as const)(
        'is true for a position whose status is %s',
        status => {
            expect(isStakingPositionActive({ ...inactive, status })).toBe(true);
        },
    );

    it('is true for an inactive position that offers an operation other than stake', () => {
        expect(isStakingPositionActive({ ...inactive, operations: ['stake', 'unstake'] })).toBe(
            true,
        );
        expect(isStakingPositionActive({ ...inactive, operations: ['vote'] })).toBe(true);
    });

    it('is true for an inactive position with rewards', () => {
        expect(
            isStakingPositionActive({ ...inactive, balances: balances({ rewards: amount('1') }) }),
        ).toBe(true);
    });
});

describe('hasPendingStakingOperation', () => {
    const position = mockStakingPosition({
        pendingTransactions: [{ txid: '0xstake', operation: 'stake' }],
    });

    it('is false without a pending transaction', () => {
        expect(hasPendingStakingOperation(mockStakingPosition())).toBe(false);
        expect(hasPendingStakingOperation(mockStakingPosition(), 'stake')).toBe(false);
    });

    it('is true for any pending transaction when no operation is given', () => {
        expect(hasPendingStakingOperation(position)).toBe(true);
    });

    it('answers for the given operation only', () => {
        expect(hasPendingStakingOperation(position, 'stake')).toBe(true);
        expect(hasPendingStakingOperation(position, 'unstake')).toBe(false);
    });
});

describe('getStakingPositionRate', () => {
    const luganodes = {
        address: 'TGyrSc9ZmTdbYziuk1SKEmdtCdETafewJ9',
        providerId: stakingProviderIdSchema.parse('luganodes'),
        amount: amount('500000000'),
    };
    const p2p = {
        address: 'TH7Fe1W8CcLeqN4LGfqX1R9EpsnrJBQJij',
        providerId: stakingProviderIdSchema.parse('p2p.org'),
        amount: amount('1500000000'),
    };
    const outside = {
        address: 'TLyqzVGLV1srkB7dToTAEqgDSfPtXRJZYH',
        providerId: stakingProviderIdSchema.parse('external'),
        amount: amount('1000000000'),
    };
    const productInfo = mockStakingProductInfo({
        rate: 3.3,
        targets: [
            { ...luganodes, name: 'Luganodes', rate: 3.2, saturation: null },
            { ...p2p, name: 'P2P.org', rate: 3.6, saturation: null },
        ],
    });

    it('is unknown without product info', () => {
        expect(getStakingPositionRate({ position: mockStakingPosition(), productInfo: null })).toBe(
            null,
        );
    });

    it('is the product rate without a position', () => {
        expect(getStakingPositionRate({ position: null, productInfo })).toBe(3.3);
    });

    it('weighs the rates of the rated targets by their amounts', () => {
        const position = mockStakingPosition({ targets: [luganodes, p2p] });

        expect(getStakingPositionRate({ position, productInfo })).toBe(3.5);
    });

    it('leaves out a target the product info does not rate', () => {
        const position = mockStakingPosition({ targets: [luganodes, outside] });

        expect(getStakingPositionRate({ position, productInfo })).toBe(3.2);
    });

    it.each([
        { name: 'has no targets', targets: [] },
        { name: 'has no rated target', targets: [outside] },
        { name: 'has rated targets without an amount', targets: [{ ...p2p, amount: amount('0') }] },
    ])('is the product rate when the position $name', ({ targets }) => {
        const position = mockStakingPosition({ targets });

        expect(getStakingPositionRate({ position, productInfo })).toBe(3.3);
    });

    it('is unknown when neither the targets nor the product are rated', () => {
        const position = mockStakingPosition({ targets: [outside] });

        expect(
            getStakingPositionRate({
                position,
                productInfo: mockStakingProductInfo({ rate: null, targets: [] }),
            }),
        ).toBe(null);
    });
});
