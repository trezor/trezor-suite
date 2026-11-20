import { stakingProviderIdSchema } from '@suite-common/earn-staking-common';
import { mockStakingProductDescriptor } from '@suite-common/earn-staking-common/mocks';
import { createTestCompositionRoot, renderHookWithStoreProvider } from '@suite-common/test-utils';
import { type Account } from '@suite-common/wallet-types';

import { useStakingAccountStatus } from './useStakingAccountStatus';
import { type MockSuiteState } from '../../../../../../mocks/mockInitialAppState';
import {
    ADA,
    ETH,
    TRX,
    ZERO_BALANCES,
    adaProduct,
    amount,
    createEarnStakingTableState,
    ethProduct,
    mockAccount,
    mockStakedPosition,
    products,
    trxProduct,
} from '../earnStakingTableTestState';

const ONE_ETH = '1000000000000000000';
const HUNDREDTH_ETH = '10000000000000000';
const TEN_ADA = '10000000';
const HUNDRED_TRX = '100000000';

const fiveBinariesProduct = mockStakingProductDescriptor({
    networkSymbol: ADA,
    type: 'native',
    providerId: stakingProviderIdSchema.parse('fivebinaries'),
    operations: ['unstake', 'claim', 'vote'],
    options: [],
    consentKey: null,
    limits: adaProduct.limits,
    messageSystemFeatures: {},
});

type RenderParams = Parameters<typeof createEarnStakingTableState>[0] & { account: Account };

const renderStatus = ({ account, ...params }: RenderParams) => {
    const { services } = createTestCompositionRoot<void, MockSuiteState>({
        preloadedState: createEarnStakingTableState({
            accounts: [account],
            descriptors: [...products, fiveBinariesProduct],
            ...params,
        }),
    });

    return renderHookWithStoreProvider(() => useStakingAccountStatus(account), { services }).result
        .current;
};

describe('useStakingAccountStatus', () => {
    it('wants funds while the balance is below the dashboard minimum', () => {
        const account = mockAccount({
            symbol: ETH,
            descriptor: '0xa',
            availableBalance: HUNDREDTH_ETH,
        });

        expect(renderStatus({ account })).toBe('insufficient-funds');
    });

    it('offers the first stake once the balance reaches it', () => {
        const account = mockAccount({ symbol: ETH, descriptor: '0xa', availableBalance: ONE_ETH });

        expect(renderStatus({ account })).toBe('staking-inactive');
    });

    it('is active with a stake and enough balance for more', () => {
        const account = mockAccount({ symbol: ETH, descriptor: '0xa', availableBalance: ONE_ETH });

        expect(
            renderStatus({
                account,
                positions: { [account.key]: [mockStakedPosition(ethProduct.id, ONE_ETH)] },
            }),
        ).toBe('staking-active');
    });

    it('is staked but wants funds with a stake and a balance below the minimum', () => {
        const account = mockAccount({
            symbol: ETH,
            descriptor: '0xa',
            availableBalance: HUNDREDTH_ETH,
        });

        expect(
            renderStatus({
                account,
                positions: { [account.key]: [mockStakedPosition(ethProduct.id, ONE_ETH)] },
            }),
        ).toBe('staked-but-insufficient-funds');
    });

    it('has everything staked with an empty balance beside a stake', () => {
        const account = mockAccount({ symbol: ETH, descriptor: '0xa' });

        expect(
            renderStatus({
                account,
                positions: { [account.key]: [mockStakedPosition(ethProduct.id, ONE_ETH)] },
            }),
        ).toBe('staking-max');
    });

    it('is staked but wants funds with unclaimed TRX rewards alone and a balance below the minimum', () => {
        const account = mockAccount({
            symbol: TRX,
            descriptor: 'trxa',
            availableBalance: '500000',
        });

        expect(
            renderStatus({
                account,
                positions: {
                    [account.key]: [
                        mockStakedPosition(trxProduct.id, '0', {
                            balances: { ...ZERO_BALANCES, rewards: amount('5000000') },
                            operations: ['stake', 'claim'],
                        }),
                    ],
                },
            }),
        ).toBe('staked-but-insufficient-funds');
    });

    it('has everything staked on an active liquid position, as Cardano delegation is', () => {
        const account = mockAccount({ symbol: ADA, descriptor: 'adaa', availableBalance: TEN_ADA });

        expect(
            renderStatus({
                account,
                positions: {
                    [account.key]: [
                        mockStakedPosition(adaProduct.id, TEN_ADA, {
                            lockup: 'liquid',
                            operations: ['unstake', 'vote'],
                        }),
                    ],
                },
            }),
        ).toBe('staking-max');
    });

    it('wants a new provider on an outdated one', () => {
        const account = mockAccount({ symbol: ADA, descriptor: 'adaa', availableBalance: TEN_ADA });

        expect(
            renderStatus({
                account,
                positions: {
                    [account.key]: [
                        mockStakedPosition(fiveBinariesProduct.id, TEN_ADA, {
                            lockup: 'liquid',
                            operations: ['unstake', 'vote'],
                            warnings: [
                                {
                                    code: 'outdated-provider',
                                    providerId: fiveBinariesProduct.providerId,
                                },
                            ],
                        }),
                    ],
                },
            }),
        ).toBe('staking-outdated-provider');
    });

    it('wants a new provider when delegated to a pool Suite does not offer', () => {
        const account = mockAccount({ symbol: ADA, descriptor: 'adaa', availableBalance: TEN_ADA });

        expect(
            renderStatus({
                account,
                positions: {
                    [account.key]: [
                        mockStakedPosition(fiveBinariesProduct.id, TEN_ADA, {
                            lockup: 'liquid',
                            operations: ['unstake', 'vote'],
                            targets: [
                                {
                                    address: 'pool1outside',
                                    providerId: fiveBinariesProduct.providerId,
                                    amount: amount(TEN_ADA),
                                },
                            ],
                        }),
                    ],
                },
            }),
        ).toBe('staking-outdated-provider');
    });

    it('has votes left with frozen TRX that is not fully voted', () => {
        const account = mockAccount({
            symbol: TRX,
            descriptor: 'trxa',
            availableBalance: HUNDRED_TRX,
        });

        expect(
            renderStatus({
                account,
                positions: {
                    [account.key]: [
                        mockStakedPosition(trxProduct.id, HUNDRED_TRX, {
                            details: {
                                kind: 'tron-staking',
                                frozen: { energy: amount(HUNDRED_TRX), bandwidth: amount('0') },
                                delegated: { energy: amount('0'), bandwidth: amount('0') },
                                votingPower: amount(HUNDRED_TRX),
                                unallocatedVotingPower: amount('40000000'),
                                rewardClaimAvailableAt: null,
                            },
                        }),
                    ],
                },
            }),
        ).toBe('staking-remaining-votes');
    });
});
