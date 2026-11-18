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
    createEarnStakingTableState,
    ethProduct,
    messageSystemWithStakeOff,
    mockAccount,
    mockStakedPosition,
    thodProduct,
} from './earnStakingTableTestState';

const ONE_ETH = '1000000000000000000';
const HALF_ETH = '500000000000000000';
const HUNDREDTH_ETH = '10000000000000000';

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
    it('lists the accounts with a funded mainnet position', () => {
        expect(selectEarnStakingStakedAccounts(createState())).toEqual([ethStaked]);
    });

    it('keeps its reference while its content is the same', () => {
        const state = createState();

        expect(selectEarnStakingStakedAccounts({ ...state })).toBe(
            selectEarnStakingStakedAccounts(state),
        );
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
});
