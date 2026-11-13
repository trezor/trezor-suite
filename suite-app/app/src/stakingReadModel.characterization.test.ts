import { combineReducers } from '@reduxjs/toolkit';

import type { DeviceRootState } from '@suite-common/device';
import {
    type StakingDep,
    type StakingRootState,
    createStakingCompositionRoot,
    formatStakingAmount,
    selectDeviceStakingPositionsCount,
    selectDeviceStakingSymbols,
    selectIsStakingAccountActive,
    selectStakingAccountBalanceWithStaking,
    selectStakingAccountTotals,
    stakingActions,
    stakingReducer,
    syncAllStakingPositionsThunk,
} from '@suite-common/earn-staking';
import { mockStakingDeviceAccess, mockStakingQueryClient } from '@suite-common/earn-staking/mocks';
// eslint-disable-next-line @typescript-eslint/no-restricted-imports -- this oracle runs the real products beside the real core, which only the app package may import together
import { createStakingProductsCompositionRoot } from '@suite-common/earn-staking-products';
import type { NetworksRootState } from '@suite-common/networks';
import { mockNetworksState } from '@suite-common/networks/mocks';
import type { QueryClientDep } from '@suite-common/react-query';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import {
    type AccountsRootState,
    type TransactionsRootState,
    type WalletSettingsRootState,
    initialWalletSettingsState,
    transactionsInitialState,
} from '@suite-common/wallet-core';
import type { Account } from '@suite-common/wallet-types';
import {
    type CardanoStakingScenario,
    type EthereumStakingScenario,
    MOCK_STAKING_NOW_SECONDS,
    type SolanaStakingScenario,
    type TronStakingScenario,
    mockCardanoStakingAccount,
    mockEthereumStakingAccount,
    mockSolanaStakingAccount,
    mockTronStakingAccount,
} from '@suite-common/wallet-types/mocks';
import { asNetworkSymbols } from '@trezor/network-module-types';

// The oracle is the seven P0.1 characterization suites in wallet-core and wallet-utils, whose
// literals the parity suites of the products package carry. This suite runs the real products, the
// real sync thunk and the new selectors on the same scenario accounts, so the literals outlive the
// legacy suites. Every reading that differs from legacy on purpose is named in its scenario.
type Reading = {
    isActive: boolean;
    staked: string;
    pending: string;
    unstaking: string;
    withdrawable: string;
    rewards: string;
    balanceWithStaking: string;
};

type State = StakingRootState &
    AccountsRootState &
    TransactionsRootState &
    WalletSettingsRootState &
    DeviceRootState &
    NetworksRootState;

type Deps = { services: StakingDep & QueryClientDep };

const ETHEREUM_SCENARIOS: EthereumStakingScenario[] = [
    'none',
    'pending',
    'pendingDeposited',
    'active',
    'unstaking',
    'claimable',
    'partiallyClaimable',
    'otherPool',
];
const SOLANA_SCENARIOS: SolanaStakingScenario[] = [
    'none',
    'activating',
    'active',
    'deactivating',
    'deactivated',
    'mixed',
    'externalOnly',
    'everstakeAndExternal',
];
const CARDANO_SCENARIOS: CardanoStakingScenario[] = [
    'notDelegated',
    'everstake',
    'everstakeNoRewards',
    'everstakeOtherPool',
    'everstakeMissingDrep',
    'everstakeAbstainDrep',
    'fiveBinaries',
    'externalPool',
];
const TRON_SCENARIOS: TronStakingScenario[] = [
    'none',
    'frozenNotVoted',
    'votedLuganodes',
    'votedSplit',
    'votedExternal',
    'unstakingPending',
    'unstakingWithdrawable',
    'rewardsOnCooldown',
];

const accounts: Account[] = [
    ...ETHEREUM_SCENARIOS.map(scenario => mockEthereumStakingAccount(scenario)),
    ...SOLANA_SCENARIOS.map(scenario => mockSolanaStakingAccount(scenario)),
    ...CARDANO_SCENARIOS.map(scenario => mockCardanoStakingAccount(scenario)),
    ...TRON_SCENARIOS.map(scenario => mockTronStakingAccount(scenario)),
];

const findAccount = (descriptor: string): Account => {
    const account = accounts.find(candidate => candidate.descriptor === descriptor);

    if (!account) throw new Error(`No fixture account ${descriptor}`);

    return account;
};

const firstAccount = accounts[0];

if (firstAccount === undefined) throw new Error('No fixture accounts');

const selectedDevice = mockSuiteDevice({
    connected: true,
    state: { staticSessionId: firstAccount.deviceState },
});

const createState = async () => {
    const adapters = createStakingProductsCompositionRoot();
    const productInfo = {
        'eth:eth:everstake:pooled': {
            rate: 3.08,
            entryPeriodDays: 4,
            exitPeriodDays: 3,
            rewardPeriodDays: null,
            nextRewardAt: null,
            targets: [],
        },
        'sol:sol:everstake:native': {
            rate: 6.24,
            entryPeriodDays: 1,
            exitPeriodDays: 1,
            rewardPeriodDays: 1,
            nextRewardAt: null,
            targets: [],
        },
    };
    const queryClient = mockStakingQueryClient({ productInfo });
    const { services } = createTestCompositionRoot<Deps, State>({
        reducer: {
            earn: combineReducers({ staking: stakingReducer }),
            wallet: combineReducers({
                accounts: (state: Account[] = accounts) => state,
                transactions: (state = transactionsInitialState) => state,
                settings: (state = initialWalletSettingsState) => state,
            }),
            device: (
                state = { devices: [selectedDevice], selectedDevice, buttonRequestsByPath: {} },
            ) => state,
            networks: (state = mockNetworksState(asNetworkSymbols(['eth', 'sol', 'ada', 'trx']))) =>
                state,
        },
        services: store => ({
            queryClient,
            staking: createStakingCompositionRoot({
                platform: 'desktop',
                adapters,
                deviceAccess: mockStakingDeviceAccess(),
                dispatch: store.dispatch,
                timers: { schedule: () => () => {} },
            }),
        }),
    });

    services.store.dispatch(
        stakingActions.productsRegistered({
            platform: 'desktop',
            descriptors: adapters.map(adapter => adapter.descriptor),
        }),
    );
    await services.store.dispatch(syncAllStakingPositionsThunk());

    return services.store.getState();
};

const read = (state: State, descriptor: string): Reading => {
    const account = findAccount(descriptor);
    const format = (amount: Parameters<typeof formatStakingAmount>[0]['amount']) =>
        formatStakingAmount({ amount, networkSymbol: account.symbol });
    const totals = selectStakingAccountTotals(state, account.key);

    return {
        isActive: selectIsStakingAccountActive(state, account.key),
        staked: format(totals.staked),
        pending: format(totals.pending),
        unstaking: format(totals.unstaking),
        withdrawable: format(totals.withdrawable),
        rewards: format(totals.rewards),
        balanceWithStaking: format(selectStakingAccountBalanceWithStaking(state, account.key)),
    };
};

const empty = (balanceWithStaking: string): Reading => ({
    isActive: false,
    staked: '0',
    pending: '0',
    unstaking: '0',
    withdrawable: '0',
    rewards: '0',
    balanceWithStaking,
});

const staked = (balanceWithStaking: string, overrides: Partial<Reading>): Reading => ({
    ...empty(balanceWithStaking),
    isActive: true,
    ...overrides,
});

describe('staking read model on the P0.1 scenarios', () => {
    let state: State;

    beforeAll(async () => {
        jest.useFakeTimers().setSystemTime(MOCK_STAKING_NOW_SECONDS * 1000);
        state = await createState();
    });

    afterAll(() => {
        jest.useRealTimers();
    });

    // Staked is the autocompound balance, which legacy calls unstakable; its principal reading is
    // derived with getStakingPositionPrincipal (parity suite).
    it.each<{ scenario: EthereumStakingScenario; expected: Reading }>([
        { scenario: 'none', expected: empty('1.5') },
        { scenario: 'pending', expected: staked('2.25', { pending: '0.75' }) },
        { scenario: 'pendingDeposited', expected: staked('1.75', { pending: '0.25' }) },
        { scenario: 'active', expected: staked('3.55', { staked: '2.05', rewards: '0.05' }) },
        {
            scenario: 'unstaking',
            expected: staked('3.02', { staked: '1.02', unstaking: '0.5', rewards: '0.02' }),
        },
        {
            scenario: 'claimable',
            expected: staked('3.02', { staked: '1.02', withdrawable: '0.5', rewards: '0.02' }),
        },
        // Differs: legacy reports the partly filled request as claimable 0.2; the position keeps
        // it as unstaking until it is filled.
        { scenario: 'partiallyClaimable', expected: staked('2', { unstaking: '0.5' }) },
        { scenario: 'otherPool', expected: empty('1.5') },
    ])('eth $scenario', ({ scenario, expected }) => {
        expect(read(state, `eth_${scenario}`)).toEqual(expected);
    });

    it.each<{ scenario: SolanaStakingScenario; expected: Reading }>([
        { scenario: 'none', expected: empty('2.5') },
        { scenario: 'activating', expected: staked('4.5', { pending: '2' }) },
        { scenario: 'active', expected: staked('7.5', { staked: '5', rewards: '0.000854795' }) },
        {
            scenario: 'deactivating',
            expected: staked('4.5', { unstaking: '2', rewards: '0.000341918' }),
        },
        { scenario: 'deactivated', expected: staked('4', { withdrawable: '1.5' }) },
        // Differs: legacy counts the 0.3 SOL of inactive stake in the balance with staking but in
        // no bucket; the position counts it as unstaking (decision 27).
        {
            scenario: 'mixed',
            expected: staked('10.3', {
                staked: '4',
                pending: '1',
                unstaking: '2.3',
                withdrawable: '0.5',
                rewards: '0.001025753',
            }),
        },
        { scenario: 'externalOnly', expected: empty('2.5') },
        {
            scenario: 'everstakeAndExternal',
            expected: staked('7.5', { staked: '5', rewards: '0.000854795' }),
        },
    ])('sol $scenario', ({ scenario, expected }) => {
        expect(read(state, `sol_${scenario}`)).toEqual(expected);
    });

    // Cardano stake is liquid: the balance with staking is the balance. Differs: legacy reads the
    // whole balance as staked; the position takes the reward balance out of it.
    it.each<{ scenario: CardanoStakingScenario; expected: Reading }>([
        { scenario: 'notDelegated', expected: empty('1000') },
        { scenario: 'everstake', expected: staked('1000', { staked: '994.75', rewards: '5.25' }) },
        { scenario: 'everstakeNoRewards', expected: staked('1000', { staked: '1000' }) },
        {
            scenario: 'everstakeOtherPool',
            expected: staked('1000', { staked: '999', rewards: '1' }),
        },
        {
            scenario: 'everstakeMissingDrep',
            expected: staked('1000', { staked: '994.75', rewards: '5.25' }),
        },
        {
            scenario: 'everstakeAbstainDrep',
            expected: staked('1000', { staked: '994.75', rewards: '5.25' }),
        },
        { scenario: 'fiveBinaries', expected: staked('1000', { staked: '999', rewards: '1' }) },
        { scenario: 'externalPool', expected: staked('1000', { staked: '998', rewards: '2' }) },
    ])('ada $scenario', ({ scenario, expected }) => {
        expect(read(state, `ada_${scenario}`)).toEqual(expected);
    });

    // Differs: the balance with staking counts the unfreeze queue (decision 19), and the generic
    // unstaking and withdrawable take their generic meaning instead of the ETH names.
    it.each<{ scenario: TronStakingScenario; expected: Reading }>([
        { scenario: 'none', expected: empty('500') },
        { scenario: 'frozenNotVoted', expected: staked('1500', { staked: '1000' }) },
        {
            scenario: 'votedLuganodes',
            expected: staked('1500', { staked: '1000', rewards: '1.5' }),
        },
        { scenario: 'votedSplit', expected: staked('1500', { staked: '1000', rewards: '1.5' }) },
        { scenario: 'votedExternal', expected: staked('1500', { staked: '1000', rewards: '1.5' }) },
        {
            scenario: 'unstakingPending',
            expected: staked('1200', { staked: '500', unstaking: '200', rewards: '1.5' }),
        },
        {
            scenario: 'unstakingWithdrawable',
            expected: staked('1500', {
                staked: '500',
                unstaking: '200',
                withdrawable: '300',
                rewards: '1.5',
            }),
        },
        {
            scenario: 'rewardsOnCooldown',
            expected: staked('1500', { staked: '1000', rewards: '2' }),
        },
    ])('trx $scenario', ({ scenario, expected }) => {
        expect(read(state, `trx_${scenario}`)).toEqual(expected);
    });

    it('lists every account with a counted non-zero position on the device, in coin order', () => {
        expect(selectDeviceStakingSymbols(state)).toEqual(['eth', 'sol', 'ada', 'trx']);
        expect(selectDeviceStakingPositionsCount(state)).toBe(26);
    });
});
