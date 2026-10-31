import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type TransactionsRootState, getWalletAssetKey } from '@suite-common/wallet-core';
import {
    type Account,
    type TokenAddress,
    type WalletAccountTransaction,
} from '@suite-common/wallet-types';
import { type StaticSessionId } from '@trezor/device-utils';

import {
    selectWalletAssetAccounts,
    selectWalletAssetUnstakedAccounts,
} from './assetDetailSelectors';
import { type HomeAssetTableState } from './homeAssetTableSelectors';

const ALICE = 'aliceWallet@device:0' as StaticSessionId;

const BTC = asNetworkSymbol('btc');
const ETH = asNetworkSymbol('eth');

const USDC_ON_ETH = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as TokenAddress;
const DAI_ON_ETH = '0x6b175474e89094c44da98b954eedeac495271d0f' as TokenAddress;

const ADA = asNetworkSymbol('ada');

const ONE_ETH_IN_WEI = '1000000000000000000';
const EVERSTAKE_CLAIM_METHOD_ID = '0x33986ffa';

type EverstakePoolParams = {
    depositedWei?: string;
    claimableWei?: string;
};

const mockEverstakePool = ({ depositedWei = '0', claimableWei = '0' }: EverstakePoolParams) => ({
    contract: '',
    name: 'Everstake',
    autocompoundBalance: '0',
    pendingBalance: '0',
    pendingDepositedBalance: '0',
    withdrawTotalAmount: '0',
    claimableAmount: claimableWei,
    depositedBalance: depositedWei,
    restakedReward: '0',
});

type MockAccountParams = {
    symbol: Account['symbol'];
    index: number;
    balance?: string;
    tokens?: { contract: TokenAddress; balance: string }[];
    isDelegating?: boolean;
    everstakePool?: EverstakePoolParams;
};

const getNetworkType = (symbol: Account['symbol']) => {
    if (symbol === ADA) return 'cardano';
    if (symbol === ETH) return 'ethereum';

    return undefined;
};

const getMisc = ({ symbol, isDelegating, everstakePool }: MockAccountParams) => {
    if (symbol === ADA) return { staking: { isActive: isDelegating } };
    if (everstakePool !== undefined) return { stakingPools: [mockEverstakePool(everstakePool)] };

    return undefined;
};

const mockAccount = (params: MockAccountParams): Account => {
    const { symbol, index, balance = '1', tokens = [] } = params;

    return {
        key: `descriptor${index}-${symbol}-${ALICE}`,
        descriptor: `descriptor${index}`,
        deviceState: ALICE,
        symbol,
        networkType: getNetworkType(symbol),
        index,
        accountType: 'normal',
        formattedBalance: balance,
        visible: true,
        tokens: tokens.map(token => ({ ...token, standard: 'ERC20', symbol: 'tkn' })),
        misc: getMisc(params),
    } as unknown as Account;
};

const mockPendingClaimTransaction = (): WalletAccountTransaction =>
    ({
        blockHeight: 0,
        ethereumSpecific: { parsedData: { methodId: EVERSTAKE_CLAIM_METHOD_ID } },
    }) as unknown as WalletAccountTransaction;

type MockStateParams = {
    accounts: Account[];
    transactions?: Record<string, WalletAccountTransaction[]>;
};

const createState = ({
    accounts,
    transactions = {},
}: MockStateParams): HomeAssetTableState & TransactionsRootState =>
    ({
        device: { selectedDevice: { state: { staticSessionId: ALICE } } },
        wallet: {
            accounts,
            transactions: { transactions },
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
    }) as unknown as HomeAssetTableState & TransactionsRootState;

const bitcoin = getWalletAssetKey({ deviceState: ALICE, symbol: BTC, contractAddress: undefined });
const cardano = getWalletAssetKey({ deviceState: ALICE, symbol: ADA, contractAddress: undefined });
const ethereum = getWalletAssetKey({ deviceState: ALICE, symbol: ETH, contractAddress: undefined });

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

describe('the accounts the staking banner speaks for', () => {
    const keysOf = (state: HomeAssetTableState & TransactionsRootState) =>
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
        const state = createState({
            accounts: [
                mockAccount({ symbol: ADA, index: 0, balance: '10' }),
                mockAccount({ symbol: ADA, index: 1, balance: '50', isDelegating: true }),
            ],
        });

        expect(keysOf(state)).toEqual([`descriptor0-ada-${ALICE}`]);
    });

    it('lists none once every account stakes', () => {
        const state = createState({
            accounts: [mockAccount({ symbol: ADA, index: 0, balance: '10', isDelegating: true })],
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
    const keysOf = (state: HomeAssetTableState & TransactionsRootState) =>
        selectWalletAssetUnstakedAccounts(state, ethereum).map(({ key }) => key);

    const claimingAccount = mockAccount({
        symbol: ETH,
        index: 0,
        everstakePool: { claimableWei: ONE_ETH_IN_WEI },
    });

    it('leaves out an account with ether deposited with Everstake', () => {
        const state = createState({
            accounts: [
                mockAccount({ symbol: ETH, index: 0 }),
                mockAccount({
                    symbol: ETH,
                    index: 1,
                    everstakePool: { depositedWei: ONE_ETH_IN_WEI },
                }),
            ],
        });

        expect(keysOf(state)).toEqual([`descriptor0-eth-${ALICE}`]);
    });

    it('counts an account as staking only once its claim is pending', () => {
        const beforeClaim = createState({ accounts: [claimingAccount] });
        const whileClaiming = createState({
            accounts: [claimingAccount],
            transactions: { [claimingAccount.key]: [mockPendingClaimTransaction()] },
        });

        expect(keysOf(beforeClaim)).toEqual([`descriptor0-eth-${ALICE}`]);
        expect(keysOf(whileClaiming)).toEqual([]);
    });

    it('ignores transactions that are not claims', () => {
        const state = createState({
            accounts: [claimingAccount],
            transactions: {
                [claimingAccount.key]: [{ blockHeight: 0 } as unknown as WalletAccountTransaction],
            },
        });

        expect(keysOf(state)).toEqual([`descriptor0-eth-${ALICE}`]);
    });
});
