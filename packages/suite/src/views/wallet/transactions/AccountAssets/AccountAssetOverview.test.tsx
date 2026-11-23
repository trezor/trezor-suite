import '@suite-common/test-utils/globalOverrides';

import { fireEvent, screen } from '@testing-library/react';

import { initialState as selectedAccountInitialState } from '@suite/account';
import { type DesktopAnalyticsDep, events } from '@suite/analytics';
import { mockDesktopAnalytics } from '@suite/analytics/mocks';
import { messages } from '@suite/intl';
import { type SuiteRouterHistoryDep, getRoute } from '@suite/router';
import { mockSuiteRouterHistory } from '@suite/router/mocks';
import { type StakingDep } from '@suite-common/earn-staking';
import {
    mockStakingQueryClient,
    mockStakingServices,
    mockStakingState,
} from '@suite-common/earn-staking/mocks';
import { stakingAmountSchema } from '@suite-common/earn-staking-common';
import {
    mockStakingPosition,
    mockStakingProductDescriptor,
    mockStakingProductInfo,
} from '@suite-common/earn-staking-common/mocks';
import { mockNetworkIcon, mockNetworksState } from '@suite-common/networks/mocks';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { type TokenAddress } from '@suite-common/tokens';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type Account, type CurrentRate, asAccountDescriptor } from '@suite-common/wallet-types';
import { mockAccountToken, mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { getFiatRateKey } from '@suite-common/wallet-utils';
import { type StaticSessionId } from '@trezor/device-utils';

import { AccountHeaderProvider } from '#src/support/suite/AccountHeaderProvider';
import { renderWithProviders } from '#src/support/test-utils/hooksHelper';

import { AccountAssetOverview } from './AccountAssetOverview';
import { type MockSuiteState, mockInitialAppState } from '../../../../../mocks/mockInitialAppState';

global.ResizeObserver = class MockedResizeObserver {
    observe = jest.fn();
    unobserve = jest.fn();
    disconnect = jest.fn();
};

const DEVICE_STATE = '1stTestnetAddress@device_id:0' as StaticSessionId;

const ETH = asNetworkSymbol('eth');
const BTC = asNetworkSymbol('btc');
const ADA = asNetworkSymbol('ada');

const USDC = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as TokenAddress;
const ONE_INCH = '0x111111111117dc0aa78b770fa6a738034120c302' as TokenAddress;

const mockRate = (rate: number) => ({ rate, usdRate: rate }) as CurrentRate;

const amount = (value: string) => stakingAmountSchema.parse(value);

const ethAccount = mockWalletAccount({
    symbol: ETH,
    deviceState: DEVICE_STATE,
    formattedBalance: '1.2',
    tokens: [
        mockAccountToken({ symbol: 'USDC', contract: USDC, balance: '1000', decimals: 6 }),
        mockAccountToken({ symbol: '1INCH', contract: ONE_INCH, balance: '2.1', decimals: 18 }),
    ],
});

/** Half an ether staked with Everstake, on top of the account's balance. */
const HALF_ETH_STAKED = mockStakingPosition({
    balances: {
        staked: amount('500000000000000000'),
        pending: amount('0'),
        unstaking: amount('0'),
        withdrawable: amount('0'),
        rewards: amount('0'),
    },
    unlocks: [],
});

const adaAccount = mockWalletAccount({
    symbol: ADA,
    deviceState: DEVICE_STATE,
    descriptor: asAccountDescriptor('adaDescriptor'),
    formattedBalance: '100',
    balance: '100000000',
});

/** A Cardano delegation: the whole balance is staked and stays in it. */
const ADA_DELEGATED = mockStakingPosition({
    lockup: 'liquid',
    balances: {
        staked: amount('100000000'),
        pending: amount('0'),
        unstaking: amount('0'),
        withdrawable: amount('0'),
        rewards: amount('0'),
    },
    unlocks: [],
});

const otherEthAccount = mockWalletAccount({
    symbol: ETH,
    deviceState: DEVICE_STATE,
    index: 1,
    descriptor: asAccountDescriptor('otherDescriptor'),
    formattedBalance: '10',
});

const btcAccount = mockWalletAccount({
    symbol: BTC,
    deviceState: DEVICE_STATE,
    formattedBalance: '0.5',
});

const PRICED_RATES = {
    [getFiatRateKey(ETH, 'usd')]: mockRate(3000),
    [getFiatRateKey(ETH, 'usd', USDC)]: mockRate(1),
    [getFiatRateKey(ETH, 'usd', ONE_INCH)]: mockRate(0.29),
    [getFiatRateKey(BTC, 'usd')]: mockRate(60000),
    [getFiatRateKey(ADA, 'usd')]: mockRate(0.5),
};

type GetStateOptions = {
    rates: Record<string, CurrentRate>;
    areSmallBalancesShown?: boolean;
    localCurrency?: MockSuiteState['wallet']['settings']['localCurrency'];
};

const networksOf = (accounts: Account[]) => [...new Set(accounts.map(({ symbol }) => symbol))];

const getState = (
    accounts: Account[],
    { rates, areSmallBalancesShown = true, localCurrency = 'usd' }: GetStateOptions,
): MockSuiteState => ({
    ...mockInitialAppState,
    earn: {
        staking: mockStakingState({
            positions: {
                [ethAccount.key]: [HALF_ETH_STAKED],
                [adaAccount.key]: [ADA_DELEGATED],
            },
        }),
    },
    networks: mockNetworksState(networksOf(accounts)),
    device: {
        ...mockInitialAppState.device,
        selectedDevice: mockSuiteDevice({ state: { staticSessionId: DEVICE_STATE } }),
    },
    tokenDefinitions: {
        [ETH]: {
            coin: { data: [USDC, ONE_INCH], error: false, isLoading: false, hide: [], show: [] },
        },
    },
    wallet: {
        ...mockInitialAppState.wallet,
        selectedAccount: selectedAccountInitialState,
        accounts,
        settings: {
            ...mockInitialAppState.wallet.settings,
            enabledNetworks: networksOf(accounts),
            localCurrency,
            areHomeAssetSmallBalancesShown: areSmallBalancesShown,
        },
        fiat: {
            ...mockInitialAppState.wallet.fiat,
            current: rates,
        },
    },
});

type RenderOverviewOptions = Partial<GetStateOptions> & {
    /** What the staking API says Ethereum staking pays, as a percentage; nothing by default. */
    ethStakingApy?: number;
};

const ETH_PRODUCT = mockStakingProductDescriptor();

const renderOverview = (
    accounts: [Account, ...Account[]],
    { rates = PRICED_RATES, ethStakingApy, ...options }: RenderOverviewOptions = {},
) => {
    const analytics = mockDesktopAnalytics();
    const suiteRouterHistory = { ...mockSuiteRouterHistory(), navigate: jest.fn() };
    const { services } = createTestCompositionRoot<
        { services: DesktopAnalyticsDep & SuiteRouterHistoryDep & StakingDep },
        MockSuiteState
    >({
        preloadedState: getState(accounts, { rates, ...options }),
        services: () => ({ analytics, suiteRouterHistory, staking: mockStakingServices() }),
    });
    const queryClient = mockStakingQueryClient({
        productInfo:
            ethStakingApy === undefined
                ? {}
                : { [ETH_PRODUCT.id]: mockStakingProductInfo({ rate: ethStakingApy }) },
    });

    renderWithProviders(
        { ...services, networks: { networkIcon: mockNetworkIcon() } },
        <AccountHeaderProvider>
            <AccountAssetOverview accountKey={accounts[0].key} />
        </AccountHeaderProvider>,
        { queryClient },
    );

    return { analytics, suiteRouterHistory };
};

const rowTestIds = () =>
    screen.getAllByTestId(/^@wallet\/account-asset\//).map(row => row.getAttribute('data-testid'));

describe('the account overview with the asset-first Home', () => {
    it('lists the coin, its stake on a row of its own, and its tokens, the most valuable first', () => {
        renderOverview([ethAccount, otherEthAccount]);

        expect(rowTestIds()).toEqual([
            '@wallet/account-asset/eth/coin',
            '@wallet/account-asset/eth/staking',
            `@wallet/account-asset/eth/${USDC}`,
            `@wallet/account-asset/eth/${ONE_INCH}`,
        ]);
        // 1.2 ETH held and 0.5 ETH staked, at $3,000.
        expect(screen.getByTestId('@wallet/account-asset/eth/coin')).toHaveTextContent(
            /\$3,600.*1\.2\d* ETH/,
        );
        expect(screen.getByTestId('@wallet/account-asset/eth/staking')).toHaveTextContent(
            new RegExp(`${messages.TR_STAKE_STAKED.defaultMessage}.*\\$1,500.*0\\.5\\d* ETH`),
        );
    });

    it('totals this account alone, its stake included, and counts its assets', () => {
        renderOverview([ethAccount, otherEthAccount]);

        // 1.2 ETH + 0.5 ETH staked at $3,000, 1,000 USDC at $1 and 2.1 1INCH at $0.29.
        expect(screen.getByTestId('@wallet/account-assets/fiat-amount')).toHaveTextContent(
            '$6,100.61',
        );
        expect(screen.getByTestId('@wallet/account-assets/balance')).toHaveTextContent(
            messages.TR_ACCOUNT_ASSETS_BALANCE.defaultMessage,
        );
        expect(screen.getByTestId('@wallet/account-assets/count')).toHaveTextContent('3 assets');
    });

    it('splits the coin into what is available and what is staked, with the rate the stake earns', () => {
        renderOverview([ethAccount], { ethStakingApy: 3.2 });

        const earn = screen.getByTestId('@wallet/account-assets/earn');

        expect(earn).toHaveTextContent(
            new RegExp(
                `${messages.TR_STAKE_AVAILABLE.defaultMessage}.*\\$3,600.*` +
                    `${messages.TR_STAKE_STAKED.defaultMessage}.*3\\.2% APY.*\\$1,500`,
            ),
        );
        expect(screen.getByTestId('@wallet/account-assets/earn/view-all')).toBeInTheDocument();
    });

    it('shows the rate the stake earns on the staking row, as the mobile row does', () => {
        renderOverview([ethAccount], { ethStakingApy: 3.2 });

        expect(screen.getByTestId('@wallet/account-asset/eth/staking')).toHaveTextContent(
            new RegExp(`${messages.TR_STAKE_STAKED.defaultMessage}.*3\\.2% APY`),
        );
    });

    it('shows no amount on the row of a stake inside the balance, which the coin row already holds', () => {
        renderOverview([adaAccount]);

        const stakingRow = screen.getByTestId('@wallet/account-asset/ada/staking');
        const balanceCell = (row: HTMLElement) => [...row.querySelectorAll('td')].at(-1);

        expect(stakingRow).toHaveTextContent(messages.TR_STAKE_STAKED.defaultMessage);
        expect(balanceCell(stakingRow)?.textContent).toBe('');
        // 100 ADA at 50c, counted once.
        expect(balanceCell(screen.getByTestId('@wallet/account-asset/ada/coin'))).toHaveTextContent(
            /\$50\.00.*100(\.0+)? ADA/,
        );
        expect(screen.getByTestId('@wallet/account-assets/fiat-amount')).toHaveTextContent(
            '$50.00',
        );
    });

    it('keeps the tokens it holds none of in a group that opens, out of the rows and the count', () => {
        const withEmptyToken = {
            ...ethAccount,
            tokens: [
                mockAccountToken({ symbol: 'USDC', contract: USDC, balance: '1000', decimals: 6 }),
                mockAccountToken({
                    symbol: '1INCH',
                    contract: ONE_INCH,
                    balance: '0',
                    decimals: 18,
                }),
            ],
        };

        renderOverview([withEmptyToken]);

        expect(rowTestIds()).not.toContain(`@wallet/account-asset/eth/${ONE_INCH}`);
        expect(screen.getByTestId('@wallet/account-assets/count')).toHaveTextContent('2 assets');

        fireEvent.click(screen.getByTestId('@wallet/account-assets/zero-balance'));

        expect(rowTestIds()).toContain(`@wallet/account-asset/eth/${ONE_INCH}`);
    });

    it('offers the Home menu without grouping and, while small balances are off, leaves the dust out of the rows but in the total', () => {
        renderOverview([ethAccount], { areSmallBalancesShown: false });

        fireEvent.click(screen.getByTestId('@dashboard/home-asset/grouping'));

        expect(
            screen.queryByTestId('@dashboard/home-asset/grouping/networks'),
        ).not.toBeInTheDocument();
        expect(
            screen.getByTestId('@dashboard/home-asset/small-balances-toggle'),
        ).toBeInTheDocument();
        // 2.1 1INCH is worth 61c.
        expect(rowTestIds()).toEqual([
            '@wallet/account-asset/eth/coin',
            '@wallet/account-asset/eth/staking',
            `@wallet/account-asset/eth/${USDC}`,
        ]);
        expect(screen.getByTestId('@wallet/account-assets/fiat-amount')).toHaveTextContent(
            '$6,100.61',
        );
        expect(screen.getByTestId('@wallet/account-assets/count')).toHaveTextContent('3 assets');
    });

    it('counts an asset without a rate as nothing, as the mobile account total does', () => {
        renderOverview([ethAccount], {
            rates: {
                [getFiatRateKey(ETH, 'usd')]: mockRate(3000),
                [getFiatRateKey(ETH, 'usd', USDC)]: mockRate(1),
            },
        });

        // 1.2 ETH + 0.5 ETH staked at $3,000 and 1,000 USDC at $1; the 1INCH has no rate.
        expect(screen.getByTestId('@wallet/account-assets/fiat-amount')).toHaveTextContent(
            '$6,100.00',
        );
    });

    it('shows the crypto balance under the fiat total on a network without tokens', () => {
        renderOverview([btcAccount]);

        expect(screen.getByTestId('@wallet/account-assets/fiat-amount')).toHaveTextContent(
            '$30,000.00',
        );
        expect(
            screen.getByTestId('@wallet/account-assets/crypto-amount-with-symbol'),
        ).toHaveTextContent('0.5 BTC');
    });

    it('shows only the fiat total on a network with tokens, a UTXO one included', () => {
        renderOverview([adaAccount]);

        expect(
            screen.queryByTestId('@wallet/account-assets/crypto-amount'),
        ).not.toBeInTheDocument();
    });

    it('does not repeat the balance when the totals are shown in the coin itself', () => {
        renderOverview([btcAccount], { localCurrency: 'btc' });

        expect(
            screen.queryByTestId('@wallet/account-assets/crypto-amount'),
        ).not.toBeInTheDocument();
    });

    describe('what navigating away from it reports', () => {
        const navigateEvent = (payload: { type: string; networkSymbol?: string }) => ({
            type: events.navigateFlowEvent.name,
            payload: { action: 'navigate', from: 'account-overview', ...payload },
        });

        it('reports opening an asset', () => {
            const { analytics } = renderOverview([ethAccount]);

            fireEvent.click(screen.getByTestId('@wallet/account-asset/eth/coin'));

            expect(analytics.report).toHaveBeenCalledTimes(1);
            expect(analytics.report).toHaveBeenCalledWith(
                navigateEvent({ type: 'asset', networkSymbol: 'eth' }),
            );
        });

        it('reports View all of the Earn card', () => {
            const { analytics } = renderOverview([ethAccount]);

            fireEvent.click(screen.getByTestId('@wallet/account-assets/earn/view-all'));

            expect(analytics.report).toHaveBeenCalledTimes(1);
            expect(analytics.report).toHaveBeenCalledWith(
                navigateEvent({ type: 'earn', networkSymbol: 'eth' }),
            );
        });

        it('reports opening the hidden tokens', () => {
            const { analytics } = renderOverview([ethAccount]);

            fireEvent.click(screen.getByTestId('@dashboard/home-asset/grouping'));
            fireEvent.click(screen.getByTestId('@dashboard/home-asset/hidden-tokens'));

            expect(analytics.report).toHaveBeenCalledTimes(1);
            expect(analytics.report).toHaveBeenCalledWith(navigateEvent({ type: 'hidden-tokens' }));
        });

        it("opens the account's own hidden tokens, not the whole wallet's", () => {
            const { suiteRouterHistory } = renderOverview([ethAccount]);

            fireEvent.click(screen.getByTestId('@dashboard/home-asset/grouping'));
            fireEvent.click(screen.getByTestId('@dashboard/home-asset/hidden-tokens'));

            expect(suiteRouterHistory.navigate).toHaveBeenCalledWith(
                expect.objectContaining({ pathname: getRoute('wallet-tokens-hidden')?.pattern }),
            );
        });

        it('reports opening the stake as going to Earn', () => {
            const { analytics } = renderOverview([ethAccount]);

            fireEvent.click(screen.getByTestId('@wallet/account-asset/eth/staking'));

            expect(analytics.report).toHaveBeenCalledTimes(1);
            expect(analytics.report).toHaveBeenCalledWith(
                navigateEvent({ type: 'earn', networkSymbol: 'eth' }),
            );
        });

        it("reports nothing for the small-balance switch, which is Home's event", () => {
            const { analytics } = renderOverview([ethAccount]);

            fireEvent.click(screen.getByTestId('@dashboard/home-asset/grouping'));
            fireEvent.click(screen.getByTestId('@dashboard/home-asset/small-balances-toggle'));

            expect(analytics.report).not.toHaveBeenCalled();
        });
    });
});
