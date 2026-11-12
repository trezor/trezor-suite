import { mockStakingState } from '@suite-common/earn-staking/mocks';
import {
    type StakingPosition,
    type StakingPositionBalances,
    stakingAmountSchema,
} from '@suite-common/earn-staking-common';
import {
    mockStakingPosition,
    mockStakingProductDescriptor,
} from '@suite-common/earn-staking-common/mocks';
import { type TokenAddress } from '@suite-common/tokens';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { getWalletAssetKey } from '@suite-common/wallet-core';
import { type Account, type AccountKey } from '@suite-common/wallet-types';
import { type StaticSessionId } from '@trezor/device-utils';

import {
    selectWalletAssetAccounts,
    selectWalletAssetHasSpendableBalance,
    selectWalletAssetUnstakedAccounts,
} from './assetDetailSelectors';
import { type HomeAssetTableState } from './homeAssetTableSelectors';

const ALICE = 'aliceWallet@device:0' as StaticSessionId;

const BTC = asNetworkSymbol('btc');
const ETH = asNetworkSymbol('eth');
const ADA = asNetworkSymbol('ada');

const USDC_ON_ETH = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as TokenAddress;
const DAI_ON_ETH = '0x6b175474e89094c44da98b954eedeac495271d0f' as TokenAddress;

const ETH_STAKING_PRODUCT = mockStakingProductDescriptor();
const ADA_STAKING_PRODUCT = mockStakingProductDescriptor({
    networkSymbol: ADA,
    type: 'native',
    operations: ['stake', 'unstake', 'claim', 'vote'],
    rewardsKind: 'claimable',
});

const amount = (value: string) => stakingAmountSchema.parse(value);

const balances = (overrides: Partial<StakingPositionBalances>): StakingPositionBalances => ({
    staked: amount('0'),
    pending: amount('0'),
    unstaking: amount('0'),
    withdrawable: amount('0'),
    rewards: amount('0'),
    ...overrides,
});

const mockDelegation = () =>
    mockStakingPosition({
        productId: ADA_STAKING_PRODUCT.id,
        lockup: 'liquid',
        balances: balances({ staked: amount('10000000') }),
        unlocks: [],
        operations: ['unstake', 'claim', 'vote'],
    });

type MockAccountParams = {
    symbol: Account['symbol'];
    index: number;
    balance?: string;
    availableBalance?: string;
    tokens?: { contract: TokenAddress; balance: string }[];
};

const mockAccount = ({
    symbol,
    index,
    balance = '1',
    availableBalance = balance,
    tokens = [],
}: MockAccountParams): Account =>
    ({
        key: `descriptor${index}-${symbol}-${ALICE}`,
        descriptor: `descriptor${index}`,
        deviceState: ALICE,
        symbol,
        index,
        accountType: 'normal',
        formattedBalance: balance,
        availableBalance,
        visible: true,
        tokens: tokens.map(token => ({ ...token, standard: 'ERC20', symbol: 'tkn' })),
    }) as unknown as Account;

type MockStateParams = {
    accounts: Account[];
    stakingPositions?: Partial<Record<AccountKey, readonly StakingPosition[]>>;
};

const createState = ({ accounts, stakingPositions = {} }: MockStateParams): HomeAssetTableState =>
    ({
        earn: {
            staking: mockStakingState({
                descriptors: [ETH_STAKING_PRODUCT, ADA_STAKING_PRODUCT],
                positions: stakingPositions,
            }),
        },
        device: { selectedDevice: { state: { staticSessionId: ALICE } } },
        wallet: {
            accounts,
            settings: {
                enabledNetworks: [BTC, ETH, ADA],
                localCurrency: 'usd',
                areHomeAssetSmallBalancesShown: true,
            },
            fiat: { current: {}, lastWeek: {}, historic: {} },
        },
        tokenDefinitions: {
            [ETH]: { coin: { data: [USDC_ON_ETH, DAI_ON_ETH], hide: [], show: [] } },
        },
        networks: {},
    }) as unknown as HomeAssetTableState;

const bitcoin = getWalletAssetKey({ deviceState: ALICE, symbol: BTC, contractAddress: undefined });
const cardano = getWalletAssetKey({ deviceState: ALICE, symbol: ADA, contractAddress: undefined });
const ethereum = getWalletAssetKey({ deviceState: ALICE, symbol: ETH, contractAddress: undefined });
const usdc = getWalletAssetKey({
    deviceState: ALICE,
    symbol: ETH,
    contractAddress: USDC_ON_ETH,
});

describe('the accounts the asset is on', () => {
    const state = createState({
        accounts: [
            mockAccount({ symbol: BTC, index: 0, balance: '0.5' }),
            mockAccount({ symbol: BTC, index: 1, balance: '0' }),
            mockAccount({ symbol: ETH, index: 2 }),
        ],
    });

    it('lists every account of the coin, the empty ones too, since they keep a history', () => {
        expect(selectWalletAssetAccounts(state, bitcoin).map(({ key }) => key)).toEqual([
            `descriptor0-btc-${ALICE}`,
            `descriptor1-btc-${ALICE}`,
        ]);
    });

    it('hands the same accounts back while they do not change', () => {
        expect(selectWalletAssetAccounts(state, bitcoin)).toBe(
            selectWalletAssetAccounts(state, bitcoin),
        );
    });
});

describe('whether an asset can be sent', () => {
    it('returns true when any account holding a native asset has spendable balance', () => {
        const state = createState({
            accounts: [
                mockAccount({ symbol: BTC, index: 0, balance: '1', availableBalance: '0' }),
                mockAccount({ symbol: BTC, index: 1, balance: '1', availableBalance: '0.5' }),
            ],
        });

        expect(selectWalletAssetHasSpendableBalance(state, bitcoin)).toBe(true);
    });

    it('returns false when all accounts holding a native asset have no spendable balance', () => {
        const state = createState({
            accounts: [
                mockAccount({ symbol: BTC, index: 0, balance: '1', availableBalance: '0' }),
                mockAccount({ symbol: BTC, index: 1, balance: '0', availableBalance: '0' }),
            ],
        });

        expect(selectWalletAssetHasSpendableBalance(state, bitcoin)).toBe(false);
    });

    it('checks the selected token balance across the accounts holding it', () => {
        const state = createState({
            accounts: [
                mockAccount({
                    symbol: ETH,
                    index: 0,
                    balance: '0',
                    availableBalance: '0',
                    tokens: [{ contract: USDC_ON_ETH, balance: '0' }],
                }),
                mockAccount({
                    symbol: ETH,
                    index: 1,
                    balance: '0',
                    availableBalance: '0',
                    tokens: [{ contract: USDC_ON_ETH, balance: '1' }],
                }),
            ],
        });

        expect(selectWalletAssetHasSpendableBalance(state, usdc)).toBe(true);
    });

    it('returns false before the asset on screen is known', () => {
        const state = createState({
            accounts: [mockAccount({ symbol: BTC, index: 0, balance: '1' })],
        });

        expect(selectWalletAssetHasSpendableBalance(state, undefined)).toBe(false);
    });
});

describe('the accounts the staking banner speaks for', () => {
    const keysOf = (state: HomeAssetTableState) =>
        selectWalletAssetUnstakedAccounts(state, cardano).map(({ key }) => key);

    it('lists every account of the coin, the one holding the most first', () => {
        const state = createState({
            accounts: [
                mockAccount({ symbol: ADA, index: 0, balance: '10' }),
                mockAccount({ symbol: ADA, index: 1, balance: '50' }),
            ],
        });

        expect(keysOf(state)).toEqual([`descriptor1-ada-${ALICE}`, `descriptor0-ada-${ALICE}`]);
    });

    it('leaves out an account that already stakes, however much it holds', () => {
        const delegating = mockAccount({ symbol: ADA, index: 1, balance: '50' });
        const state = createState({
            accounts: [mockAccount({ symbol: ADA, index: 0, balance: '10' }), delegating],
            stakingPositions: { [delegating.key]: [mockDelegation()] },
        });

        expect(keysOf(state)).toEqual([`descriptor0-ada-${ALICE}`]);
    });

    it('lists none once every account stakes', () => {
        const delegating = mockAccount({ symbol: ADA, index: 0, balance: '10' });
        const state = createState({
            accounts: [delegating],
            stakingPositions: { [delegating.key]: [mockDelegation()] },
        });

        expect(keysOf(state)).toEqual([]);
    });

    it('hands the same accounts back while they do not change', () => {
        const state = createState({
            accounts: [
                mockAccount({ symbol: ADA, index: 0, balance: '10' }),
                mockAccount({ symbol: ADA, index: 1, balance: '50' }),
            ],
        });

        expect(selectWalletAssetUnstakedAccounts(state, cardano)).toBe(
            selectWalletAssetUnstakedAccounts(state, cardano),
        );
    });
});

describe('the ether accounts the staking banner speaks for', () => {
    const keysOf = (state: HomeAssetTableState) =>
        selectWalletAssetUnstakedAccounts(state, ethereum).map(({ key }) => key);

    const idle = mockAccount({ symbol: ETH, index: 0 });
    const staking = mockAccount({ symbol: ETH, index: 1 });

    it('leaves out an account with an active stake', () => {
        const state = createState({
            accounts: [idle, staking],
            stakingPositions: { [staking.key]: [mockStakingPosition()] },
        });

        expect(keysOf(state)).toEqual([idle.key]);
    });

    it('keeps an account whose pool entry holds nothing', () => {
        const state = createState({
            accounts: [idle, staking],
            stakingPositions: {
                [staking.key]: [
                    mockStakingPosition({
                        status: 'inactive',
                        balances: balances({}),
                        unlocks: [],
                        targets: [],
                        operations: ['stake'],
                    }),
                ],
            },
        });

        expect(keysOf(state)).toEqual([idle.key, staking.key]);
    });

    it('counts an account as staking once its first stake is activating', () => {
        const state = createState({
            accounts: [idle, staking],
            stakingPositions: {
                [staking.key]: [
                    mockStakingPosition({
                        status: 'activating',
                        balances: balances({ pending: amount('1000000000000000000') }),
                        unlocks: [],
                        targets: [],
                        operations: ['stake'],
                    }),
                ],
            },
        });

        expect(keysOf(state)).toEqual([idle.key]);
    });
});
