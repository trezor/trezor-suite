import { stakingProviderIdSchema } from '@suite-common/earn-staking-common';
import { mockStakingProductDescriptor } from '@suite-common/earn-staking-common/mocks';
import { getFiatRateKey } from '@suite-common/wallet-utils';

import {
    selectEarnStakingActivateSymbols,
    selectEarnStakingAvailableCount,
    selectEarnStakingFiatAmountsByAccountKey,
    selectEarnStakingStakeableAccounts,
    selectEarnStakingStakedAccounts,
    selectEarnStakingUnderfundedAccounts,
} from './earnStakingTableSelectors';
import {
    ADA,
    BTC,
    ETH,
    SOL,
    THOD,
    TRX,
    ZERO_BALANCES,
    amount,
    createEarnStakingTableState,
    ethProduct,
    messageSystemWithStakeOff,
    mockAccount,
    mockRate,
    mockStakedPosition,
    products,
    thodProduct,
    trxProduct,
} from './earnStakingTableTestState';

const ONE_ETH = '1000000000000000000';
const HALF_ETH = '500000000000000000';
const HUNDREDTH_ETH = '10000000000000000';
const FIVE_TRX = '5000000';

const ethStaked = mockAccount({ symbol: ETH, descriptor: '0xstaked', availableBalance: ONE_ETH });
const ethStakeable = mockAccount({
    symbol: ETH,
    descriptor: '0xstakeable',
    availableBalance: HALF_ETH,
    formattedBalance: '0.5',
});
const ethUnderfunded = mockAccount({
    symbol: ETH,
    descriptor: '0xunderfunded',
    availableBalance: HUNDREDTH_ETH,
    formattedBalance: '0.01',
});
const solEmpty = mockAccount({ symbol: SOL, descriptor: 'solempty' });
const thodStaked = mockAccount({ symbol: THOD, descriptor: '0xthod', availableBalance: ONE_ETH });
const btcAccount = mockAccount({ symbol: BTC, descriptor: 'bc1btc', availableBalance: '100000' });

const createState = (overrides: Parameters<typeof createEarnStakingTableState>[0] = {}) =>
    createEarnStakingTableState({
        accounts: [ethStaked, ethStakeable, ethUnderfunded, solEmpty, thodStaked, btcAccount],
        positions: {
            [ethStaked.key]: [mockStakedPosition(ethProduct.id, '2000000000000000000')],
            [thodStaked.key]: [mockStakedPosition(thodProduct.id, ONE_ETH)],
        },
        ...overrides,
    });

describe('selectEarnStakingStakedAccounts', () => {
    it('lists the accounts with an active mainnet position', () => {
        expect(selectEarnStakingStakedAccounts(createState())).toEqual([ethStaked]);
    });

    it('lists an account whose position is active on unclaimed rewards alone', () => {
        const trxRewardsOnly = mockAccount({ symbol: TRX, descriptor: 'trxrewards' });
        const state = createState({
            accounts: [trxRewardsOnly],
            positions: {
                [trxRewardsOnly.key]: [
                    mockStakedPosition(trxProduct.id, '0', {
                        balances: { ...ZERO_BALANCES, rewards: amount(FIVE_TRX) },
                        operations: ['stake'],
                    }),
                ],
            },
        });

        expect(selectEarnStakingStakedAccounts(state)).toEqual([trxRewardsOnly]);
        expect(selectEarnStakingUnderfundedAccounts(state)).toEqual([]);
    });

    it('keeps its reference while its content is the same', () => {
        const state = createState();

        expect(selectEarnStakingStakedAccounts({ ...state })).toBe(
            selectEarnStakingStakedAccounts(state),
        );
    });

    it('lists an account with a position in two products once', () => {
        const otherEthProduct = mockStakingProductDescriptor({
            providerId: stakingProviderIdSchema.parse('p2p.org'),
        });

        expect(
            selectEarnStakingStakedAccounts(
                createState({
                    descriptors: [...products, otherEthProduct],
                    positions: {
                        [ethStaked.key]: [
                            mockStakedPosition(ethProduct.id, ONE_ETH),
                            mockStakedPosition(otherEthProduct.id, ONE_ETH),
                        ],
                    },
                }),
            ),
        ).toEqual([ethStaked]);
    });
});

describe('the accounts without a position', () => {
    it('splits them on the dashboard minimum of the network product', () => {
        const state = createState();

        expect(selectEarnStakingStakeableAccounts(state)).toEqual([ethStakeable]);
        expect(selectEarnStakingUnderfundedAccounts(state)).toEqual([ethUnderfunded, solEmpty]);
    });

    it('leaves out testnets and networks without a product', () => {
        const state = createState({ accounts: [thodStaked, btcAccount], positions: {} });

        expect(selectEarnStakingStakeableAccounts(state)).toEqual([]);
        expect(selectEarnStakingUnderfundedAccounts(state)).toEqual([]);
    });
});

describe('selectEarnStakingActivateSymbols', () => {
    it('names the supported mainnet networks without an account, in network order', () => {
        expect(selectEarnStakingActivateSymbols(createState())).toEqual([ADA, TRX]);
    });

    it('leaves out a network the device does not support', () => {
        expect(
            selectEarnStakingActivateSymbols(
                createState({ unavailableCapabilities: { [ADA]: 'no-support' } }),
            ),
        ).toEqual([TRX]);
    });

    it('leaves out a network whose stake is switched off', () => {
        expect(
            selectEarnStakingActivateSymbols(
                createState({ messageSystem: messageSystemWithStakeOff('ada.staking.stake') }),
            ),
        ).toEqual([TRX]);
    });
});

describe('selectEarnStakingAvailableCount', () => {
    it('counts each mainnet network the device supports or has an account on once', () => {
        expect(selectEarnStakingAvailableCount(createState())).toBe(4);
    });

    it('still counts a network the device cannot activate while an account exists', () => {
        expect(
            selectEarnStakingAvailableCount(
                createState({
                    unavailableCapabilities: {
                        [ETH]: 'no-support',
                        [ADA]: 'no-support',
                        [TRX]: 'no-support',
                    },
                }),
            ),
        ).toBe(2);
    });
});

describe('selectEarnStakingFiatAmountsByAccountKey', () => {
    it('values the stake of a staked account and the balance of the others', () => {
        expect(selectEarnStakingFiatAmountsByAccountKey(createState())).toEqual({
            [ethStaked.key]: '6000',
            [ethStakeable.key]: '1500',
            [ethUnderfunded.key]: '30',
            [solEmpty.key]: '0',
        });
    });

    it('keeps its reference while its content is the same', () => {
        const state = createState();

        expect(selectEarnStakingFiatAmountsByAccountKey({ ...state })).toBe(
            selectEarnStakingFiatAmountsByAccountKey(state),
        );
    });

    it('keeps the previous map alone, so a valuation is let go once the rate moves on', () => {
        const state = createState();
        const withEthRate = (rate: number): typeof state => ({
            ...state,
            wallet: {
                ...state.wallet,
                fiat: {
                    ...state.wallet.fiat,
                    current: { [getFiatRateKey(ETH, 'usd')]: mockRate(rate) },
                },
            },
        });

        const valuedAt3000 = selectEarnStakingFiatAmountsByAccountKey(state);
        const valuedAt3100 = selectEarnStakingFiatAmountsByAccountKey(withEthRate(3100));
        const valuedAt3000Again = selectEarnStakingFiatAmountsByAccountKey(withEthRate(3000));

        expect(valuedAt3100[ethStaked.key]).toBe('6200');
        expect(valuedAt3000Again).toEqual(valuedAt3000);
        expect(valuedAt3000Again).not.toBe(valuedAt3000);
    });
});
