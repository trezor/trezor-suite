import { type NetworkSymbol, asNetworkSymbol } from '@suite-common/wallet-config';
import type {
    SolanaStakingAccount,
    StakingPool,
    TronAccountExtraData,
    TronStakingInfo,
} from '@trezor/blockchain-link-types';

import { mockWalletAccount } from './mockWalletAccount';
import { type AccountBase, type AccountWithNetworkType, asAccountDescriptor } from '../src/account';

type MockStakingAccountParams = Omit<Partial<AccountBase>, 'key' | 'symbol'> & {
    symbol?: NetworkSymbol;
};

type CardanoStaking = AccountWithNetworkType<'cardano'>['misc']['staking'];
type CardanoDrep = NonNullable<CardanoStaking['drep']>;

const SECONDS_IN_DAY = 24 * 60 * 60;

export const MOCK_STAKING_NOW_SECONDS = 1_800_000_000;

export const MOCK_ETHEREUM_EVERSTAKE_CONTRACT = '0x7a7f0b3c23C23a31cFcb0c44709be70d4D545c6e';
export const MOCK_SOLANA_EVERSTAKE_VALIDATOR = '9QU2QSxhb24FUX3Tu2FpczXjpK3VYrvRudywSZaM29mF';
export const MOCK_SOLANA_EXTERNAL_VALIDATOR = 'ExternalValidatorPubkey111111111111111111111';
export const MOCK_CARDANO_EVERSTAKE_POOL =
    'pool1xflehvzad4wr6rrvf6eea65jst5af0r4k0rh4xvmnqgvkzt3xjt';
export const MOCK_CARDANO_EVERSTAKE_OTHER_POOL =
    'pool1sysgx87cwxnqy0pqn8g97gdhd0dmre9rw3jvpn2k7apuwa7cgkn';
export const MOCK_CARDANO_FIVE_BINARIES_POOL =
    'pool1k2qhlrrweu8fecd4hx4hn22lv00nrd3rjdxj6durax7m78q7ynu';
export const MOCK_CARDANO_EXTERNAL_POOL =
    'pool1z22x50lqsrwent6en0llzzs9e577rx7n3mv9kfw7udwa2rf42fa';
export const MOCK_CARDANO_EVERSTAKE_DREP_ID =
    'drep1yt8p080ajks6zdnxd9z6a6q60p9sm9j5rl7tc63mfna8r6cnp4wr3';
export const MOCK_TRON_LUGANODES_SR = 'TGyrSc9ZmTdbYziuk1SKEmdtCdETafewJ9';
export const MOCK_TRON_P2P_ORG_SR = 'TH7Fe1W8CcLeqN4LGfqX1R9EpsnrJBQJij';
export const MOCK_TRON_EXTERNAL_SR = 'TLyqzVGLV1srkB7dToTAEqgDSfPtXRJZYH';

const getMockDescriptor = (symbol: NetworkSymbol, scenario: string) =>
    asAccountDescriptor(`${symbol}_${scenario}`);

export type EthereumStakingScenario =
    'none' | 'pending' | 'active' | 'unstaking' | 'claimable' | 'partiallyClaimable' | 'otherPool';

const mockEverstakePool = (pool: Partial<StakingPool>): StakingPool => ({
    contract: MOCK_ETHEREUM_EVERSTAKE_CONTRACT,
    name: 'Everstake',
    pendingBalance: '0',
    pendingDepositedBalance: '0',
    depositedBalance: '0',
    withdrawTotalAmount: '0',
    claimableAmount: '0',
    restakedReward: '0',
    autocompoundBalance: '0',
    ...pool,
});

const ETHEREUM_STAKING_POOLS: Record<EthereumStakingScenario, StakingPool[] | undefined> = {
    none: undefined,
    pending: [
        mockEverstakePool({
            pendingBalance: '500000000000000000',
            pendingDepositedBalance: '250000000000000000',
        }),
    ],
    active: [
        mockEverstakePool({
            depositedBalance: '2000000000000000000',
            autocompoundBalance: '2050000000000000000',
            restakedReward: '50000000000000000',
        }),
    ],
    unstaking: [
        mockEverstakePool({
            depositedBalance: '1000000000000000000',
            autocompoundBalance: '1020000000000000000',
            restakedReward: '20000000000000000',
            withdrawTotalAmount: '500000000000000000',
        }),
    ],
    claimable: [
        mockEverstakePool({
            depositedBalance: '1000000000000000000',
            autocompoundBalance: '1020000000000000000',
            restakedReward: '20000000000000000',
            withdrawTotalAmount: '500000000000000000',
            claimableAmount: '500000000000000000',
        }),
    ],
    partiallyClaimable: [
        mockEverstakePool({
            withdrawTotalAmount: '500000000000000000',
            claimableAmount: '200000000000000000',
        }),
    ],
    otherPool: [
        mockEverstakePool({
            contract: '0x0000000000000000000000000000000000000001',
            name: 'OtherPool',
            depositedBalance: '3000000000000000000',
            autocompoundBalance: '3000000000000000000',
        }),
    ],
};

export const mockEthereumStakingAccount = (
    scenario: EthereumStakingScenario,
    { symbol = asNetworkSymbol('eth'), ...account }: MockStakingAccountParams = {},
): AccountWithNetworkType<'ethereum'> => {
    const walletAccount = mockWalletAccount({
        descriptor: getMockDescriptor(symbol, scenario),
        balance: '1500000000000000000',
        availableBalance: '1500000000000000000',
        formattedBalance: '1.5',
        ...account,
        symbol,
    });

    if (walletAccount.networkType !== 'ethereum') {
        throw new Error(`${symbol} is not an Ethereum network.`);
    }

    const stakingPools = ETHEREUM_STAKING_POOLS[scenario];

    if (!stakingPools) {
        return walletAccount;
    }

    return { ...walletAccount, misc: { ...walletAccount.misc, stakingPools } };
};

export type SolanaStakingScenario =
    | 'none'
    | 'activating'
    | 'active'
    | 'deactivating'
    | 'deactivated'
    | 'mixed'
    | 'externalOnly'
    | 'everstakeAndExternal';

const mockSolanaStakeAccount = (
    status: string,
    stake: string,
    voterPubkey = MOCK_SOLANA_EVERSTAKE_VALIDATOR,
): SolanaStakingAccount => ({
    status,
    stake,
    rentExemptReserve: '2282880',
    voterPubkey,
    activationEpoch: 790,
});

type SolanaStakeAccounts = {
    everstake: SolanaStakingAccount[];
    external: SolanaStakingAccount[];
};

const SOLANA_STAKE_ACCOUNTS: Record<SolanaStakingScenario, SolanaStakeAccounts> = {
    none: { everstake: [], external: [] },
    activating: { everstake: [mockSolanaStakeAccount('activating', '2000000000')], external: [] },
    active: { everstake: [mockSolanaStakeAccount('active', '5000000000')], external: [] },
    deactivating: {
        everstake: [mockSolanaStakeAccount('deactivating', '2000000000')],
        external: [],
    },
    deactivated: {
        everstake: [mockSolanaStakeAccount('deactivated', '1500000000')],
        external: [],
    },
    mixed: {
        everstake: [
            mockSolanaStakeAccount('activating', '1000000000'),
            mockSolanaStakeAccount('active', '4000000000'),
            mockSolanaStakeAccount('deactivating', '2000000000'),
            mockSolanaStakeAccount('deactivated', '500000000'),
            mockSolanaStakeAccount('inactive', '300000000'),
        ],
        external: [],
    },
    externalOnly: {
        everstake: [],
        external: [mockSolanaStakeAccount('active', '10000000000', MOCK_SOLANA_EXTERNAL_VALIDATOR)],
    },
    everstakeAndExternal: {
        everstake: [mockSolanaStakeAccount('active', '5000000000')],
        external: [
            mockSolanaStakeAccount('active', '10000000000', MOCK_SOLANA_EXTERNAL_VALIDATOR),
            mockSolanaStakeAccount('deactivated', '1000000000', MOCK_SOLANA_EXTERNAL_VALIDATOR),
        ],
    },
};

export const mockSolanaStakingAccount = (
    scenario: SolanaStakingScenario,
    { symbol = asNetworkSymbol('sol'), ...account }: MockStakingAccountParams = {},
): AccountWithNetworkType<'solana'> => {
    const walletAccount = mockWalletAccount({
        descriptor: getMockDescriptor(symbol, scenario),
        balance: '2500000000',
        availableBalance: '2500000000',
        formattedBalance: '2.5',
        ...account,
        symbol,
    });

    if (walletAccount.networkType !== 'solana') {
        throw new Error(`${symbol} is not a Solana network.`);
    }

    const { everstake, external } = SOLANA_STAKE_ACCOUNTS[scenario];

    return {
        ...walletAccount,
        misc: {
            ...walletAccount.misc,
            rent: 890880,
            solStakingAccounts: everstake,
            solExternalStakingAccounts: external,
            solEpoch: 800,
        },
    };
};

export type CardanoStakingScenario =
    | 'notDelegated'
    | 'everstake'
    | 'everstakeNoRewards'
    | 'everstakeOtherPool'
    | 'everstakeMissingDrep'
    | 'everstakeAbstainDrep'
    | 'fiveBinaries'
    | 'externalPool';

const MOCK_CARDANO_EVERSTAKE_DREP: CardanoDrep = {
    drep_id: MOCK_CARDANO_EVERSTAKE_DREP_ID,
    hex: 'ce179dfd95a1a136666945aee81a784b0d96541ffcbc6a3b4cfa71eb',
    amount: '0',
    active: true,
    active_epoch: 550,
    has_script: false,
};

const MOCK_CARDANO_ABSTAIN_DREP: CardanoDrep = {
    drep_id: 'drep_always_abstain',
    hex: '',
    amount: '0',
    active: true,
    active_epoch: null,
    has_script: false,
};

const mockCardanoStaking = (staking: Partial<CardanoStaking>): CardanoStaking => ({
    address: 'stake1u9ylzsgxaa6xctf4juup682ar3juj85n8tx3hthnljg47zctvm3rc',
    isActive: true,
    rewards: '0',
    poolId: MOCK_CARDANO_EVERSTAKE_POOL,
    drep: MOCK_CARDANO_EVERSTAKE_DREP,
    ...staking,
});

const CARDANO_STAKING: Record<CardanoStakingScenario, CardanoStaking> = {
    notDelegated: mockCardanoStaking({ isActive: false, poolId: null, drep: null }),
    everstake: mockCardanoStaking({ rewards: '5250000' }),
    everstakeNoRewards: mockCardanoStaking({}),
    everstakeOtherPool: mockCardanoStaking({
        rewards: '1000000',
        poolId: MOCK_CARDANO_EVERSTAKE_OTHER_POOL,
    }),
    everstakeMissingDrep: mockCardanoStaking({ rewards: '5250000', drep: null }),
    everstakeAbstainDrep: mockCardanoStaking({
        rewards: '5250000',
        drep: MOCK_CARDANO_ABSTAIN_DREP,
    }),
    fiveBinaries: mockCardanoStaking({
        rewards: '1000000',
        poolId: MOCK_CARDANO_FIVE_BINARIES_POOL,
    }),
    externalPool: mockCardanoStaking({
        rewards: '2000000',
        poolId: MOCK_CARDANO_EXTERNAL_POOL,
        drep: null,
    }),
};

export const mockCardanoStakingAccount = (
    scenario: CardanoStakingScenario,
    { symbol = asNetworkSymbol('ada'), ...account }: MockStakingAccountParams = {},
): AccountWithNetworkType<'cardano'> => {
    const walletAccount = mockWalletAccount({
        descriptor: getMockDescriptor(symbol, scenario),
        balance: '1000000000',
        availableBalance: '1000000000',
        formattedBalance: '1000',
        ...account,
        symbol,
    });

    if (walletAccount.networkType !== 'cardano') {
        throw new Error(`${symbol} is not a Cardano network.`);
    }

    return { ...walletAccount, misc: { staking: CARDANO_STAKING[scenario] } };
};

export type TronStakingScenario =
    | 'none'
    | 'frozenNotVoted'
    | 'votedLuganodes'
    | 'votedSplit'
    | 'votedExternal'
    | 'unstakingPending'
    | 'unstakingWithdrawable'
    | 'rewardsOnCooldown';

const mockTronStakingInfo = (stakingInfo: Partial<TronStakingInfo>): TronStakingInfo => ({
    stakedBalance: '1000000000',
    stakedBalanceEnergy: '1000000000',
    stakedBalanceBandwidth: '0',
    unstakingBatches: [],
    totalVotingPower: '1000',
    availableVotingPower: '0',
    votes: [{ address: MOCK_TRON_LUGANODES_SR, voteCount: '1000' }],
    unclaimedReward: '1500000',
    latestWithdrawTime: 0,
    delegatedBalanceEnergy: '0',
    delegatedBalanceBandwidth: '0',
    ...stakingInfo,
});

const TRON_STAKING_INFO: Record<TronStakingScenario, TronStakingInfo | undefined> = {
    none: undefined,
    frozenNotVoted: mockTronStakingInfo({
        availableVotingPower: '1000',
        votes: [],
        unclaimedReward: '0',
    }),
    votedLuganodes: mockTronStakingInfo({}),
    votedSplit: mockTronStakingInfo({
        votes: [
            { address: MOCK_TRON_LUGANODES_SR, voteCount: '500' },
            { address: MOCK_TRON_P2P_ORG_SR, voteCount: '500' },
        ],
    }),
    votedExternal: mockTronStakingInfo({
        votes: [{ address: MOCK_TRON_EXTERNAL_SR, voteCount: '1000' }],
    }),
    unstakingPending: mockTronStakingInfo({
        stakedBalance: '500000000',
        stakedBalanceEnergy: '500000000',
        totalVotingPower: '500',
        votes: [{ address: MOCK_TRON_LUGANODES_SR, voteCount: '500' }],
        unstakingBatches: [
            { amount: '200000000', expireTime: MOCK_STAKING_NOW_SECONDS + 7 * SECONDS_IN_DAY },
        ],
    }),
    unstakingWithdrawable: mockTronStakingInfo({
        stakedBalance: '500000000',
        stakedBalanceEnergy: '500000000',
        totalVotingPower: '500',
        votes: [{ address: MOCK_TRON_LUGANODES_SR, voteCount: '500' }],
        unstakingBatches: [
            { amount: '300000000', expireTime: MOCK_STAKING_NOW_SECONDS - SECONDS_IN_DAY },
            { amount: '200000000', expireTime: MOCK_STAKING_NOW_SECONDS + 7 * SECONDS_IN_DAY },
        ],
    }),
    rewardsOnCooldown: mockTronStakingInfo({
        unclaimedReward: '2000000',
        latestWithdrawTime: MOCK_STAKING_NOW_SECONDS - 60 * 60,
    }),
};

const mockTronResources = (stakingInfo: TronStakingInfo | undefined): TronAccountExtraData => ({
    availableStakedBandwidth: 0,
    totalStakedBandwidth: 0,
    availableFreeBandwidth: 600,
    totalFreeBandwidth: 600,
    availableEnergy: 13000,
    totalEnergy: 13000,
    totalEnergyLimit: 180_000_000_000,
    totalEnergyWeight: 14_000_000_000,
    totalBandwidthLimit: 43_200_000_000,
    totalBandwidthWeight: 26_000_000_000,
    stakingInfo,
});

export const mockTronStakingAccount = (
    scenario: TronStakingScenario,
    { symbol = asNetworkSymbol('trx'), ...account }: MockStakingAccountParams = {},
): AccountWithNetworkType<'tron'> => {
    const walletAccount = mockWalletAccount({
        descriptor: getMockDescriptor(symbol, scenario),
        balance: '500000000',
        availableBalance: '500000000',
        formattedBalance: '500',
        ...account,
        symbol,
    });

    if (walletAccount.networkType !== 'tron') {
        throw new Error(`${symbol} is not a Tron network.`);
    }

    return {
        ...walletAccount,
        misc: {
            ...walletAccount.misc,
            tronResources: mockTronResources(TRON_STAKING_INFO[scenario]),
        },
    };
};
