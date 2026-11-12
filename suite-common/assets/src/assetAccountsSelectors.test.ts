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
import { type WalletAssetKey, getWalletAssetKey } from '@suite-common/wallet-core';
import { type Account, type AccountKey } from '@suite-common/wallet-types';
import { type StaticSessionId } from '@trezor/device-utils';

import {
    type AssetAccountsRootState,
    selectAssetAccounts,
    selectHiddenAssetAccountKeys,
} from './assetAccountsSelectors';

const accountsOfAsset = (state: AssetAccountsRootState, assetKey: WalletAssetKey) =>
    selectAssetAccounts(state).filter(assetAccount => assetAccount.assetKey === assetKey);

const shownAssetAccounts = (state: AssetAccountsRootState) => {
    const hidden = new Set(selectHiddenAssetAccountKeys(state));

    return selectAssetAccounts(state).filter(
        assetAccount => !hidden.has(assetAccount.assetAccountKey),
    );
};

const ALICE = 'aliceWallet@device:0' as StaticSessionId;
const BOB = 'bobWallet@device:1' as StaticSessionId;

const ETH = asNetworkSymbol('eth');
const BTC = asNetworkSymbol('btc');
const DSOL = asNetworkSymbol('dsol');
const ADA = asNetworkSymbol('ada');

const USDC_ON_ETH = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as TokenAddress;
const USDT_ON_ETH = '0xdac17f958d2ee523a2206206994597c13d831ec7' as TokenAddress;
const UNKNOWN_TOKEN = '0x0000000000000000000000000000000000000bad' as TokenAddress;

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

type MockAccountParams = {
    deviceState?: StaticSessionId;
    symbol?: Account['symbol'];
    index?: number;
    balance?: string;
    isVisible?: boolean;
    tokens?: { contract: TokenAddress; balance: string; standard?: string }[];
};

const mockAccount = ({
    deviceState = ALICE,
    symbol = ETH,
    index = 0,
    balance = '1',
    isVisible = true,
    tokens = [],
}: MockAccountParams = {}): Account =>
    ({
        key: `descriptor${index}-${symbol}-${deviceState}`,
        deviceState,
        symbol,
        index,
        formattedBalance: balance,
        visible: isVisible,
        tokens,
    }) as unknown as Account;

type MockStateParams = {
    accounts: Account[];
    stakingPositions?: Partial<Record<AccountKey, readonly StakingPosition[]>>;
    knownTokens?: TokenAddress[];
    hiddenTokens?: TokenAddress[];
    shownTokens?: TokenAddress[];
};

const createState = ({
    accounts,
    stakingPositions = {},
    knownTokens = [USDC_ON_ETH, USDT_ON_ETH],
    hiddenTokens = [],
    shownTokens = [],
}: MockStateParams): AssetAccountsRootState => {
    const definitions = {
        coin: { data: knownTokens, hide: hiddenTokens, show: shownTokens },
    };

    return {
        earn: {
            staking: mockStakingState({
                descriptors: [ETH_STAKING_PRODUCT, ADA_STAKING_PRODUCT],
                positions: stakingPositions,
            }),
        },
        wallet: { accounts },
        tokenDefinitions: { eth: definitions, dsol: definitions },
    } as unknown as AssetAccountsRootState;
};

const aliceCoin = getWalletAssetKey({ deviceState: ALICE, symbol: ETH });
const aliceUsdc = getWalletAssetKey({
    deviceState: ALICE,
    symbol: ETH,
    contractAddress: USDC_ON_ETH,
});

describe('which assetAccounts the user is shown', () => {
    const contractsOf = (
        assetAccounts: readonly { contractAddress?: TokenAddress | undefined }[],
    ) => assetAccounts.map(assetAccount => assetAccount.contractAddress);

    it('leaves out a token the user hid', () => {
        const state = createState({
            accounts: [mockAccount({ tokens: [{ contract: USDC_ON_ETH, balance: '100' }] })],
            hiddenTokens: [USDC_ON_ETH],
        });

        expect(contractsOf(shownAssetAccounts(state))).toEqual([undefined]);
    });

    it('leaves out a token nothing vouches for', () => {
        const state = createState({
            accounts: [mockAccount({ tokens: [{ contract: UNKNOWN_TOKEN, balance: '7' }] })],
        });

        expect(contractsOf(shownAssetAccounts(state))).toEqual([undefined]);
    });

    it('keeps a token the user asked to see, definition or not', () => {
        const state = createState({
            accounts: [mockAccount({ tokens: [{ contract: UNKNOWN_TOKEN, balance: '7' }] })],
            shownTokens: [UNKNOWN_TOKEN],
        });

        expect(contractsOf(shownAssetAccounts(state))).toEqual([undefined, UNKNOWN_TOKEN]);
    });

    it('keeps a token the user asked to see, even after hiding it', () => {
        const state = createState({
            accounts: [mockAccount({ tokens: [{ contract: USDC_ON_ETH, balance: '100' }] })],
            hiddenTokens: [USDC_ON_ETH],
            shownTokens: [USDC_ON_ETH],
        });

        expect(contractsOf(shownAssetAccounts(state))).toEqual([undefined, USDC_ON_ETH]);
    });

    it('never hides an NFT, whatever the coin definitions say of its contract', () => {
        const state = createState({
            accounts: [
                mockAccount({
                    tokens: [{ contract: UNKNOWN_TOKEN, balance: '1', standard: 'ERC721' }],
                }),
            ],
        });

        expect(selectHiddenAssetAccountKeys(state)).toEqual([]);
    });

    it('keeps every token on a network with no definitions to go by', () => {
        const state = createState({
            accounts: [
                mockAccount({ symbol: DSOL, tokens: [{ contract: UNKNOWN_TOKEN, balance: '3' }] }),
            ],
        });

        expect(contractsOf(shownAssetAccounts(state))).toEqual([undefined, UNKNOWN_TOKEN]);
    });

    it('names the hidden assetAccounts of every account that holds one', () => {
        const state = createState({
            accounts: [
                mockAccount({ index: 0, tokens: [{ contract: USDC_ON_ETH, balance: '1' }] }),
                mockAccount({ index: 1, tokens: [{ contract: USDC_ON_ETH, balance: '2' }] }),
            ],
            hiddenTokens: [USDC_ON_ETH],
        });

        expect(selectHiddenAssetAccountKeys(state)).toHaveLength(2);
    });

    it('names nothing when the user hid nothing', () => {
        const state = createState({
            accounts: [mockAccount({ tokens: [{ contract: USDC_ON_ETH, balance: '1' }] })],
        });

        expect(selectHiddenAssetAccountKeys(state)).toEqual([]);
    });

    it('hands back the same hidden assetAccounts while the accounts and the hiding are unchanged', () => {
        const state = createState({
            accounts: [mockAccount({ tokens: [{ contract: USDC_ON_ETH, balance: '1' }] })],
            hiddenTokens: [USDC_ON_ETH],
        });

        expect(selectHiddenAssetAccountKeys(state)).toBe(selectHiddenAssetAccountKeys(state));
    });
});

describe('what becomes a assetAccount', () => {
    it('is the account’s own coin, always', () => {
        const state = createState({ accounts: [mockAccount({ balance: '2.5' })] });

        expect(accountsOfAsset(state, aliceCoin)).toEqual([
            expect.objectContaining({ cryptoBalance: '2.5', contractAddress: undefined }),
        ]);
    });

    it('is the account’s own coin with what it has locked in staking', () => {
        const account = mockAccount({ balance: '1' });
        const state = createState({
            accounts: [account],
            stakingPositions: {
                [account.key]: [
                    mockStakingPosition({
                        balances: balances({ staked: amount('2000000000000000000') }),
                        unlocks: [],
                    }),
                ],
            },
        });

        expect(accountsOfAsset(state, aliceCoin)).toEqual([
            expect.objectContaining({ cryptoBalance: '3' }),
        ]);
    });

    it('is the Cardano coin once, as its liquid stake is the balance itself', () => {
        const account = mockAccount({ symbol: ADA, balance: '5' });
        const state = createState({
            accounts: [account],
            stakingPositions: {
                [account.key]: [
                    mockStakingPosition({
                        productId: ADA_STAKING_PRODUCT.id,
                        lockup: 'liquid',
                        balances: balances({ staked: amount('5000000') }),
                        unlocks: [],
                        operations: ['unstake', 'claim', 'vote'],
                    }),
                ],
            },
        });

        expect(
            accountsOfAsset(state, getWalletAssetKey({ deviceState: ALICE, symbol: ADA })),
        ).toEqual([expect.objectContaining({ cryptoBalance: '5' })]);
    });

    it('is each token the account holds', () => {
        const state = createState({
            accounts: [mockAccount({ tokens: [{ contract: USDC_ON_ETH, balance: '100' }] })],
        });

        expect(accountsOfAsset(state, aliceUsdc)).toEqual([
            expect.objectContaining({ cryptoBalance: '100', contractAddress: USDC_ON_ETH }),
        ]);
    });

    it('is not a token with no balance', () => {
        const state = createState({
            accounts: [mockAccount({ tokens: [{ contract: USDC_ON_ETH, balance: '0' }] })],
        });

        expect(accountsOfAsset(state, aliceUsdc)).toEqual([]);
    });

    it('is a token the user asked to see, definition or not', () => {
        const state = createState({
            accounts: [mockAccount({ tokens: [{ contract: UNKNOWN_TOKEN, balance: '7' }] })],
            shownTokens: [UNKNOWN_TOKEN],
        });

        expect(
            accountsOfAsset(
                state,
                getWalletAssetKey({
                    deviceState: ALICE,
                    symbol: ETH,
                    contractAddress: UNKNOWN_TOKEN,
                }),
            ),
        ).toHaveLength(1);
    });

    it('is any token on a network that has no definitions at all', () => {
        const state = createState({
            accounts: [
                mockAccount({
                    symbol: DSOL,
                    tokens: [{ contract: UNKNOWN_TOKEN, balance: '3' }],
                }),
            ],
            knownTokens: [],
        });

        expect(
            accountsOfAsset(
                state,
                getWalletAssetKey({
                    deviceState: ALICE,
                    symbol: DSOL,
                    contractAddress: UNKNOWN_TOKEN,
                }),
            ),
        ).toHaveLength(1);
    });
});

describe('the groups a assetAccount is in', () => {
    it('puts every account’s assetAccount of one asset under that asset', () => {
        const state = createState({
            accounts: [
                mockAccount({ index: 0, tokens: [{ contract: USDC_ON_ETH, balance: '100' }] }),
                mockAccount({ index: 1, tokens: [{ contract: USDC_ON_ETH, balance: '40' }] }),
            ],
        });

        expect(
            accountsOfAsset(state, aliceUsdc).map(assetAccount => assetAccount.cryptoBalance),
        ).toEqual(['100', '40']);
    });

    it('keeps the same token in two wallets apart', () => {
        const state = createState({
            accounts: [
                mockAccount({
                    deviceState: ALICE,
                    tokens: [{ contract: USDC_ON_ETH, balance: '1' }],
                }),
                mockAccount({
                    deviceState: BOB,
                    tokens: [{ contract: USDC_ON_ETH, balance: '9' }],
                }),
            ],
        });

        expect(
            accountsOfAsset(
                state,
                getWalletAssetKey({ deviceState: BOB, symbol: ETH, contractAddress: USDC_ON_ETH }),
            ).map(assetAccount => assetAccount.cryptoBalance),
        ).toEqual(['9']);
    });

    it('puts an account’s coin and tokens under that account', () => {
        const account = mockAccount({ tokens: [{ contract: USDC_ON_ETH, balance: '100' }] });
        const state = createState({ accounts: [account] });

        expect(
            selectAssetAccounts(state).filter(
                assetAccount => assetAccount.accountKey === account.key,
            ),
        ).toHaveLength(2);
    });

    it("keeps one wallet's assets apart from another's", () => {
        const state = createState({
            accounts: [
                mockAccount({ symbol: ETH, tokens: [{ contract: USDC_ON_ETH, balance: '100' }] }),
                mockAccount({ deviceState: BOB, index: 1 }),
            ],
        });

        const assetKeys = [
            ...new Set(selectAssetAccounts(state).map(assetAccount => assetAccount.assetKey)),
        ].filter(assetKey => assetKey.startsWith(ALICE));

        expect(assetKeys).toEqual([aliceCoin, aliceUsdc]);
    });
});

describe('what a write does not change', () => {
    it('does not change what an account nothing wrote to holds', () => {
        const untouched = mockAccount({ symbol: BTC, index: 0 });
        const before = mockAccount({ symbol: ETH, index: 1, balance: '1' });
        const bitcoinKey = getWalletAssetKey({ deviceState: ALICE, symbol: BTC });

        const firstAccounts = accountsOfAsset(
            createState({ accounts: [untouched, before] }),
            bitcoinKey,
        );
        const afterWrite = accountsOfAsset(
            createState({ accounts: [untouched, { ...before, formattedBalance: '2' }] }),
            bitcoinKey,
        );

        expect(afterWrite).toEqual(firstAccounts);
    });

    it('follows the account that was written', () => {
        const before = mockAccount({ balance: '1' });
        const state = createState({ accounts: [before] });

        expect(accountsOfAsset(state, aliceCoin)[0]?.cryptoBalance).toBe('1');
        expect(
            accountsOfAsset(
                createState({ accounts: [{ ...before, formattedBalance: '3' }] }),
                aliceCoin,
            )[0]?.cryptoBalance,
        ).toBe('3');
    });

    it('keeps the assetAccount of an account nothing wrote to', () => {
        const untouched = mockAccount({ index: 0 });
        const before = accountsOfAsset(
            createState({ accounts: [untouched, mockAccount({ index: 1, balance: '1' })] }),
            aliceCoin,
        );

        const after = accountsOfAsset(
            createState({ accounts: [untouched, mockAccount({ index: 1, balance: '2' })] }),
            aliceCoin,
        );

        expect(after[0]).toBe(before[0]);
    });

    it('keeps the assetAccounts while the accounts and the positions are unchanged', () => {
        const accounts = [mockAccount({ tokens: [{ contract: USDC_ON_ETH, balance: '1' }] })];

        expect(selectAssetAccounts(createState({ accounts }))).toBe(
            selectAssetAccounts(createState({ accounts })),
        );
    });

    it('builds the assetAccounts once for repeated reads', () => {
        const state = createState({ accounts: [mockAccount()] });

        expect(selectAssetAccounts(state)).toBe(selectAssetAccounts(state));
    });
});
