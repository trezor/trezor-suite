import { type ChainRewardsWithFiat, type YieldDtoV2 } from '@suite-common/earn-stablecoin-api';
import { mockNetworksState } from '@suite-common/networks/mocks';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { FIVE_BINARIES_POOLS, asNetworkSymbol } from '@suite-common/wallet-config';
import { mockGetSupportedNetworks } from '@suite-common/wallet-config/mocks';
import {
    type Account,
    asAccountDescriptor,
    asBaseCurrencyAmount,
} from '@suite-common/wallet-types';
import {
    mockAccountToken,
    mockWalletAccount,
    networkSpecificDefaultCardano,
} from '@suite-common/wallet-types/mocks';
import { type StaticSessionId } from '@trezor/device-utils';
import { BigNumber } from '@trezor/utils';

import {
    type EarnListRootState,
    selectCardanoStakedWithFiveBinariesAccountKey,
    selectStakingListItems,
    selectStakingListSymbols,
    selectYieldClaimAccountItems,
    selectYieldClaimAccounts,
    selectYieldClaimListItems,
    selectYieldClaimTokens,
    selectYieldClaimTotalFiatAmount,
    selectYieldListItems,
    selectYieldListVaultIcons,
} from './earnListSelectors';

const DEVICE_STATIC_SESSION_ID: StaticSessionId = 'selectedWallet@deviceId:0';
const RECEIPT_TOKEN_CONTRACT = '0x' + 'a'.repeat(40);
const UNDERLYING_TOKEN_CONTRACT = '0x' + 'b'.repeat(40);
const REWARD_TOKEN_CONTRACT = '0x' + 'c'.repeat(40);

const selectedDevice = mockSuiteDevice({
    id: 'selected-device',
    connected: true,
    available: true,
    remember: true,
    state: { staticSessionId: DEVICE_STATIC_SESSION_ID },
});

const createAdaAccount = (descriptor: string, balance: string, visible = true) =>
    mockWalletAccount(
        {
            symbol: asNetworkSymbol('ada'),
            descriptor: asAccountDescriptor(descriptor),
            deviceState: DEVICE_STATIC_SESSION_ID,
            balance,
            visible,
        },
        networkSpecificDefaultCardano,
    );

const createFiveBinariesAdaAccount = (descriptor: string, visible = true): Account => {
    const account = createAdaAccount(descriptor, '5000000', visible);

    if (account.networkType !== 'cardano') return account;

    return {
        ...account,
        misc: {
            ...account.misc,
            staking: { ...account.misc.staking, poolId: FIVE_BINARIES_POOLS[0] ?? null },
        },
    };
};

const createEthAccount = (descriptor: string, receiptTokenBalance?: string) =>
    mockWalletAccount({
        symbol: asNetworkSymbol('eth'),
        descriptor: asAccountDescriptor(descriptor),
        deviceState: DEVICE_STATIC_SESSION_ID,
        tokens: receiptTokenBalance
            ? [mockAccountToken({ contract: RECEIPT_TOKEN_CONTRACT, balance: receiptTokenBalance })]
            : [],
    });

const createState = (accounts: Account[]): EarnListRootState => ({
    networks: mockNetworksState(mockGetSupportedNetworks()),
    device: {
        devices: [selectedDevice],
        selectedDevice,
    },
    wallet: {
        accounts,
    },
});

const vault = {
    id: 'vault-usdc',
    network: 'ethereum',
    token: {
        address: UNDERLYING_TOKEN_CONTRACT,
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
        network: 'ethereum',
    },
    outputToken: {
        address: RECEIPT_TOKEN_CONTRACT,
        symbol: 'vUSDC',
        name: 'Vault USDC',
        decimals: 6,
        network: 'ethereum',
    },
    rewardRate: { total: 0.05 },
} as YieldDtoV2;

describe('selectStakingListItems', () => {
    it('lists visible accounts with active staking', () => {
        const stakedAccount = createAdaAccount('adastaked', '5000000');
        const state = createState([
            createEthAccount('ethnostaking'),
            createAdaAccount('adahidden', '7000000', false),
            stakedAccount,
        ]);

        expect(selectStakingListItems(state)).toEqual([
            { symbol: asNetworkSymbol('ada'), accountKey: stakedAccount.key, balance: '5' },
        ]);
        expect(selectStakingListSymbols(state)).toEqual([asNetworkSymbol('ada')]);
    });

    it('keeps item and array references across recreated state', () => {
        const accounts = [createAdaAccount('adafirst', '5000000'), createEthAccount('eth')];
        const firstItems = selectStakingListItems(createState([...accounts]));
        const secondItems = selectStakingListItems(createState([...accounts]));

        expect(secondItems).toBe(firstItems);
        expect(secondItems[0]).toBe(firstItems[0]);
        expect(selectStakingListSymbols(createState([...accounts]))).toBe(
            selectStakingListSymbols(createState([...accounts])),
        );
    });

    it('returns a stable empty array when nothing is staked', () => {
        expect(selectStakingListItems(createState([createEthAccount('eth')]))).toBe(
            selectStakingListItems(createState([])),
        );
    });
});

describe('selectCardanoStakedWithFiveBinariesAccountKey', () => {
    it('returns the first visible cardano account staked with Five Binaries', () => {
        const fiveBinariesAccount = createFiveBinariesAdaAccount('adafivebinaries');
        const state = createState([
            createAdaAccount('adaeverstake', '5000000'),
            createFiveBinariesAdaAccount('adahidden', false),
            fiveBinariesAccount,
        ]);

        expect(selectCardanoStakedWithFiveBinariesAccountKey(state)).toBe(fiveBinariesAccount.key);
    });

    it('returns null when no cardano account is staked with Five Binaries', () => {
        expect(
            selectCardanoStakedWithFiveBinariesAccountKey(
                createState([createAdaAccount('adaeverstake', '5000000'), createEthAccount('eth')]),
            ),
        ).toBeNull();
    });
});

describe('selectYieldClaimAccounts', () => {
    it('lists only ethereum accounts with claim support and keeps the reference', () => {
        const ethAccount = createEthAccount('ethclaim');
        const accounts = [createAdaAccount('ada', '5000000'), ethAccount];
        const firstAccounts = selectYieldClaimAccounts(createState([...accounts]));
        const secondAccounts = selectYieldClaimAccounts(createState([...accounts]));

        expect(firstAccounts).toEqual([ethAccount]);
        expect(secondAccounts).toBe(firstAccounts);
    });
});

const createReward = ({
    claimable,
    fiatClaimable,
    tokenAddress = REWARD_TOKEN_CONTRACT,
}: {
    claimable: string;
    fiatClaimable: string | null;
    tokenAddress?: string;
}): ChainRewardsWithFiat['rewards'][number] => ({
    root: '0xroot',
    amount: claimable,
    claimed: '0',
    pending: '0',
    token: { address: tokenAddress, chainId: 1, symbol: 'USDC', decimals: 6 },
    proofs: [],
    claimable: asBaseCurrencyAmount(new BigNumber(claimable)),
    fiat: {
        amount: null,
        claimed: null,
        pending: null,
        claimable:
            fiatClaimable === null ? null : asBaseCurrencyAmount(new BigNumber(fiatClaimable)),
    },
});

const createChainRewards = (
    account: Account,
    rewards: ChainRewardsWithFiat['rewards'],
): ChainRewardsWithFiat => ({
    chainId: 1,
    address: account.descriptor,
    totalClaimable: rewards
        .reduce((total, reward) => total.plus(reward.claimable), new BigNumber(0))
        .toFixed(),
    rewards,
});

describe('selectYieldClaimListItems', () => {
    const claimAccount = createEthAccount('ethclaimer', '1000000');
    const emptyAccount = createEthAccount('ethnoclaim');
    const createRewards = () => [
        createChainRewards(claimAccount, [
            createReward({ claimable: '1000000', fiatClaimable: '1.25' }),
            createReward({ claimable: '500000', fiatClaimable: '0.75' }),
        ]),
        createChainRewards(emptyAccount, [createReward({ claimable: '0', fiatClaimable: '0' })]),
    ];

    it('builds one claim item per account with claimable rewards', () => {
        const state = createState([createAdaAccount('ada', '5000000'), emptyAccount, claimAccount]);

        expect(selectYieldClaimListItems(state, createRewards())).toEqual([
            {
                accountKey: claimAccount.key,
                networkSymbol: asNetworkSymbol('eth'),
                claimableRewardsCount: 2,
                fiatClaimableAmount: expect.anything(),
                tokens: [
                    {
                        networkSymbol: asNetworkSymbol('eth'),
                        contractAddress: REWARD_TOKEN_CONTRACT,
                        symbol: 'USDC',
                        decimals: 6,
                        claimableAmount: '1.5',
                    },
                ],
            },
        ]);
        expect(
            selectYieldClaimListItems(state, createRewards())[0]?.fiatClaimableAmount?.toString(),
        ).toBe('2');
        expect(selectYieldClaimTokens(state, createRewards())).toEqual([
            {
                networkSymbol: asNetworkSymbol('eth'),
                contractAddress: REWARD_TOKEN_CONTRACT,
                symbol: 'USDC',
            },
        ]);
        expect(selectYieldClaimTotalFiatAmount(state, createRewards())?.toString()).toBe('2');
    });

    it('returns null total when any claim item lacks a fiat value', () => {
        const state = createState([claimAccount]);
        const rewards = [
            createChainRewards(claimAccount, [
                createReward({ claimable: '1000000', fiatClaimable: null }),
            ]),
        ];

        expect(selectYieldClaimListItems(state, rewards)[0]?.fiatClaimableAmount).toBeNull();
        expect(selectYieldClaimTotalFiatAmount(state, rewards)).toBeNull();
    });

    it('keeps item, token, total and account item references across recreated inputs', () => {
        const accounts = [claimAccount, emptyAccount];
        const first = selectYieldClaimListItems(createState([...accounts]), createRewards());
        const second = selectYieldClaimListItems(createState([...accounts]), createRewards());

        expect(second).toBe(first);
        expect(second[0]).toBe(first[0]);
        expect(second[0]?.tokens).toBe(first[0]?.tokens);
        expect(second[0]?.fiatClaimableAmount).toBe(first[0]?.fiatClaimableAmount);
        expect(selectYieldClaimTokens(createState([...accounts]), createRewards())).toBe(
            selectYieldClaimTokens(createState([...accounts]), createRewards()),
        );
        expect(selectYieldClaimTotalFiatAmount(createState([...accounts]), createRewards())).toBe(
            selectYieldClaimTotalFiatAmount(createState([...accounts]), createRewards()),
        );
        expect(
            selectYieldClaimAccountItems(createState([...accounts]), createRewards(), [vault]),
        ).toBe(selectYieldClaimAccountItems(createState([...accounts]), createRewards(), [vault]));
    });

    it('returns a new reference when a claimable amount changes', () => {
        const state = createState([claimAccount]);
        const buildFor = (claimable: string) =>
            selectYieldClaimListItems(state, [
                createChainRewards(claimAccount, [
                    createReward({ claimable, fiatClaimable: '1.25' }),
                ]),
            ]);

        expect(buildFor('2000000')).not.toBe(buildFor('1000000'));
    });

    it('attaches the account vault positions to the claim account items', () => {
        const state = createState([claimAccount, emptyAccount]);
        const secondVault = { ...vault, id: 'vault-second' } as YieldDtoV2;

        expect(selectYieldClaimAccountItems(state, createRewards(), [vault, secondVault])).toEqual([
            {
                summary: expect.objectContaining({ accountKey: claimAccount.key }),
                vaults: [
                    { name: 'Vault USDC', tokenContract: UNDERLYING_TOKEN_CONTRACT },
                    { name: 'Vault USDC', tokenContract: UNDERLYING_TOKEN_CONTRACT },
                ],
            },
        ]);
        expect(selectYieldClaimAccountItems(state, createRewards(), [])).toEqual([
            { summary: expect.objectContaining({ accountKey: claimAccount.key }), vaults: [] },
        ]);
    });
});

describe('selectYieldListItems', () => {
    it('lists accounts holding the vault receipt token', () => {
        const positionAccount = createEthAccount('ethposition', '1000000');
        const state = createState([createEthAccount('ethempty'), positionAccount]);

        expect(selectYieldListItems(state, [vault])).toEqual([
            expect.objectContaining({
                id: `${vault.id}-${positionAccount.key}`,
                networkSymbol: asNetworkSymbol('eth'),
                tokenSymbol: 'USDC',
                vaultName: 'Vault USDC',
                apy: 5,
                underlyingTokenContract: UNDERLYING_TOKEN_CONTRACT,
                receiptTokenContract: RECEIPT_TOKEN_CONTRACT,
                contractAddress: RECEIPT_TOKEN_CONTRACT,
                tokenContractAddress: UNDERLYING_TOKEN_CONTRACT,
                accountKey: positionAccount.key,
            }),
        ]);
    });

    it('keeps item and array references across recreated state', () => {
        const accounts = [createEthAccount('ethposition', '1000000')];
        const firstItems = selectYieldListItems(createState([...accounts]), [vault]);
        const secondItems = selectYieldListItems(createState([...accounts]), [vault]);

        expect(secondItems).toBe(firstItems);
        expect(secondItems[0]).toBe(firstItems[0]);
    });

    it('orders positions by network token order and account index instead of the API order', () => {
        const usdtReceiptTokenContract = '0x' + 'd'.repeat(40);
        const usdtVault = {
            ...vault,
            id: 'vault-usdt',
            token: { ...vault.token, symbol: 'USDT', name: 'Tether' },
            outputToken: {
                ...vault.outputToken,
                address: usdtReceiptTokenContract,
                symbol: 'vUSDT',
                name: 'Vault USDT',
            },
        } as YieldDtoV2;
        const secondAccount = mockWalletAccount({
            symbol: asNetworkSymbol('eth'),
            descriptor: asAccountDescriptor('ethsecond'),
            deviceState: DEVICE_STATIC_SESSION_ID,
            index: 1,
            tokens: [mockAccountToken({ contract: RECEIPT_TOKEN_CONTRACT, balance: '1000000' })],
        });
        const firstAccount = mockWalletAccount({
            symbol: asNetworkSymbol('eth'),
            descriptor: asAccountDescriptor('ethfirst'),
            deviceState: DEVICE_STATIC_SESSION_ID,
            index: 0,
            tokens: [
                mockAccountToken({ contract: usdtReceiptTokenContract, balance: '1000000' }),
                mockAccountToken({ contract: RECEIPT_TOKEN_CONTRACT, balance: '1000000' }),
            ],
        });
        const state = createState([secondAccount, firstAccount]);

        expect(
            selectYieldListItems(state, [usdtVault, vault]).map(({ id, accountKey }) => ({
                id,
                accountKey,
            })),
        ).toEqual([
            { id: `${vault.id}-${firstAccount.key}`, accountKey: firstAccount.key },
            { id: `${vault.id}-${secondAccount.key}`, accountKey: secondAccount.key },
            { id: `${usdtVault.id}-${firstAccount.key}`, accountKey: firstAccount.key },
        ]);
    });

    it('returns a new reference when a position balance changes', () => {
        const sameTokenVault = {
            ...vault,
            token: { ...vault.token, address: RECEIPT_TOKEN_CONTRACT },
        } as YieldDtoV2;
        const firstItems = selectYieldListItems(
            createState([createEthAccount('ethposition', '1000000')]),
            [sameTokenVault],
        );
        const secondItems = selectYieldListItems(
            createState([createEthAccount('ethposition', '2000000')]),
            [sameTokenVault],
        );

        expect(secondItems).not.toBe(firstItems);
    });
});

describe('selectYieldListVaultIcons', () => {
    it('lists each vault once when several accounts hold the same receipt token', () => {
        const state = createState([
            createEthAccount('ethfirst', '1000000'),
            createEthAccount('ethsecond', '2000000'),
        ]);

        expect(selectYieldListItems(state, [vault])).toHaveLength(2);
        expect(selectYieldListVaultIcons(state, [vault])).toEqual([
            {
                networkSymbol: asNetworkSymbol('eth'),
                tokenSymbol: 'USDC',
                tokenContractAddress: UNDERLYING_TOKEN_CONTRACT,
            },
        ]);
    });

    it('keeps icon and array references across recreated state', () => {
        const accounts = [createEthAccount('ethposition', '1000000')];
        const firstIcons = selectYieldListVaultIcons(createState([...accounts]), [vault]);
        const secondIcons = selectYieldListVaultIcons(createState([...accounts]), [vault]);

        expect(secondIcons).toBe(firstIcons);
        expect(secondIcons[0]).toBe(firstIcons[0]);
    });

    it('returns a stable empty array when there are no positions', () => {
        expect(
            selectYieldListVaultIcons(createState([createEthAccount('ethempty')]), [vault]),
        ).toBe(selectYieldListVaultIcons(createState([]), [vault]));
    });
});
