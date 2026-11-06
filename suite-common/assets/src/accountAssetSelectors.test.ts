import { type TokenAddress } from '@suite-common/tokens';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type Account, type AccountKey } from '@suite-common/wallet-types';
import { getFiatRateKey } from '@suite-common/wallet-utils';
import { type TokenInfo } from '@trezor/blockchain-link-types';
import { FirmwareType, type StaticSessionId } from '@trezor/device-utils';

import {
    selectAccountAssets,
    selectAccountSmallBalanceSummary,
    selectDisplayedAccountAssets,
} from './accountAssetSelectors';
import { type HomeAssetTableState } from './homeAssetTableSelectors';

const ALICE = 'aliceWallet@device:0' as StaticSessionId;

const ETH = asNetworkSymbol('eth');
const ADA = asNetworkSymbol('ada');

const USDC = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as TokenAddress;
const ENS = '0xc18360217d8f7ab5e7c516566761ea12ce7f9d72' as TokenAddress;
const HIDDEN = '0x00000000000000000000000000000000000000aa' as TokenAddress;
const UNKNOWN = '0x00000000000000000000000000000000000000bb' as TokenAddress;

const mockToken = (contract: TokenAddress, symbol: string, balance: string, decimals: number) =>
    ({ standard: 'ERC20', contract, symbol, balance, decimals }) satisfies TokenInfo;

const HALF_ETH_IN_WEI = '500000000000000000';

const mockAccount = (overrides: Partial<Account> = {}): Account =>
    ({
        key: `descriptor0-eth-${ALICE}` as AccountKey,
        deviceState: ALICE,
        symbol: ETH,
        networkType: 'ethereum',
        formattedBalance: '1.2',
        tokens: [],
        ...overrides,
    }) as Account;

const stakingPool = {
    name: 'Everstake',
    autocompoundBalance: HALF_ETH_IN_WEI,
    pendingBalance: '0',
    pendingDepositedBalance: '0',
    withdrawTotalAmount: '0',
    claimableAmount: '0',
    depositedBalance: '0',
    restakedReward: '0',
};

// A current rate carries the dollar rate too; in dollars the two are the same number.
const mockRate = (rate: number, contract?: TokenAddress) => ({
    [getFiatRateKey(ETH, 'usd', contract)]: { rate, usdRate: rate },
});

type CreateStateOptions = {
    rates?: Record<string, { rate: number; usdRate?: number }>;
    areSmallBalancesShown?: boolean;
    localCurrency?: 'usd' | 'eur';
};

const createState = (
    accounts: Account[],
    { rates = {}, areSmallBalancesShown = true, localCurrency = 'usd' }: CreateStateOptions = {},
) =>
    ({
        device: {
            selectedDevice: {
                state: { staticSessionId: ALICE },
                firmwareType: FirmwareType.Universal,
            },
        },
        wallet: {
            accounts,
            settings: {
                localCurrency,
                enabledNetworks: [ETH, ADA],
                areHomeAssetSmallBalancesShown: areSmallBalancesShown,
            },
            fiat: { current: rates, lastWeek: {}, historic: {} },
        },
        tokenDefinitions: {
            [ETH]: { coin: { data: [USDC, ENS, HIDDEN], hide: [HIDDEN], show: [] } },
        },
        networks: {
            [ETH]: { symbol: ETH, name: 'Ethereum' },
            [ADA]: { symbol: ADA, name: 'Cardano' },
        },
    }) as unknown as HomeAssetTableState;

const rowsOf = (state: HomeAssetTableState, account: Account) =>
    selectAccountAssets(state, account.key).map(asset => [
        asset.kind,
        asset.displaySymbol,
        asset.amount,
        asset.fiatValue?.toFixed(),
    ]);

describe('selectAccountAssets', () => {
    const account = mockAccount({
        misc: { stakingPools: [stakingPool] },
        tokens: [mockToken(USDC, 'USDC', '1000', 6), mockToken(ENS, 'ENS', '1.12', 18)],
    } as Partial<Account>);

    it('splits the stake from the coin and lists the tokens, the most valuable first', () => {
        const state = createState([account], {
            rates: { ...mockRate(3000), ...mockRate(1, USDC), ...mockRate(20, ENS) },
        });

        expect(rowsOf(state, account)).toEqual([
            ['coin', 'ETH', '1.2', '3600'],
            ['staking', 'ETH', '0.5', '1500'],
            ['token', 'USDC', '1000', '1000'],
            ['token', 'ENS', '1.12', '22.4'],
        ]);
    });

    it('puts what nothing can price last', () => {
        const state = createState([account], { rates: mockRate(1, USDC) });

        expect(rowsOf(state, account).map(([kind, symbol]) => `${kind}:${symbol}`)).toEqual([
            'token:USDC',
            'coin:ETH',
            'staking:ETH',
            'token:ENS',
        ]);
    });

    it('leaves out hidden, unrecognized and empty tokens, but keeps an empty coin', () => {
        const empty = mockAccount({
            formattedBalance: '0',
            tokens: [
                mockToken(HIDDEN, 'HID', '5', 18),
                mockToken(UNKNOWN, 'BAD', '5', 18),
                mockToken(ENS, 'ENS', '0', 18),
            ],
        } as Partial<Account>);

        expect(rowsOf(createState([empty]), empty)).toEqual([['coin', 'ETH', '0', undefined]]);
    });

    it('gives a Cardano delegation no row, as it stakes the spendable balance', () => {
        const cardano = mockAccount({
            key: `descriptor0-ada-${ALICE}` as AccountKey,
            symbol: ADA,
            networkType: 'cardano',
            formattedBalance: '3',
            misc: { staking: { isActive: true, address: '', rewards: '0', poolId: null } },
        } as Partial<Account>);

        expect(rowsOf(createState([cardano]), cardano)).toEqual([['coin', 'ADA', '3', undefined]]);
    });

    it.each([
        [
            'trx',
            'a',
            [
                ['coin', 'TRX', '2', undefined],
                ['staking', 'TRX', '1', undefined],
            ],
        ],
        ['ttrx', 'no', [['coin', 'tTRX', '2', undefined]]],
    ] as const)(
        '%s with a frozen balance has %s Staking row, as Home counts it',
        (symbol, _article, rows) => {
            const tron = mockAccount({
                key: `descriptor0-${symbol}-${ALICE}` as AccountKey,
                symbol: asNetworkSymbol(symbol),
                networkType: 'tron',
                formattedBalance: '2',
                misc: { tronResources: { stakingInfo: { stakedBalance: '1000000' } } },
            } as Partial<Account>);

            expect(rowsOf(createState([tron]), tron)).toEqual(rows);
        },
    );

    it('has no rows for an account that is not there', () => {
        expect(selectAccountAssets(createState([]), 'missing' as AccountKey)).toEqual([]);
    });
});

describe('the small balances of an account', () => {
    const dust = mockAccount({
        formattedBalance: '0',
        tokens: [mockToken(USDC, 'USDC', '1000', 6), mockToken(ENS, 'ENS', '0.03', 18)],
    } as Partial<Account>);
    const rates = { ...mockRate(3000), ...mockRate(1, USDC), ...mockRate(20, ENS) };
    const displayed = (state: HomeAssetTableState) =>
        selectDisplayedAccountAssets(state, dust.key).map(({ displaySymbol }) => displaySymbol);

    it('counts a token worth under a dollar, never the coin, and lists it only while they are shown', () => {
        const shown = createState([dust], { rates });
        const hidden = createState([dust], { rates, areSmallBalancesShown: false });

        const summary = selectAccountSmallBalanceSummary(shown, dust.key);

        expect(summary?.assetCount).toBe(1);
        expect(summary?.fiatValue.toFixed()).toBe('0.6');
        // The empty coin is worth exactly nothing, which sorts it under the dust.
        expect(displayed(shown)).toEqual(['USDC', 'ENS', 'ETH']);
        expect(displayed(hidden)).toEqual(['USDC', 'ETH']);
    });

    it('hides nothing until a dollar is known in the chosen currency', () => {
        const state = createState([dust], {
            rates: { [getFiatRateKey(ETH, 'eur', ENS)]: { rate: 18 } },
            areSmallBalancesShown: false,
            localCurrency: 'eur',
        });

        expect(selectAccountSmallBalanceSummary(state, dust.key)).toBeUndefined();
        expect(displayed(state)).toEqual(['ENS', 'ETH', 'USDC']);
    });
});
