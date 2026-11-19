import '@suite-common/test-utils/globalOverrides';

import { screen } from '@testing-library/react';

import { initialState as selectedAccountInitialState } from '@suite/account';
import { messages } from '@suite/intl';
import { mockStakingState } from '@suite-common/earn-staking/mocks';
import { stakingAmountSchema } from '@suite-common/earn-staking-common';
import { mockStakingPosition } from '@suite-common/earn-staking-common/mocks';
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

const USDC = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as TokenAddress;
const ONE_INCH = '0x111111111117dc0aa78b770fa6a738034120c302' as TokenAddress;

const mockRate = (rate: number) => ({ rate, usdRate: rate }) as CurrentRate;

/** A rate whose fetch failed: it holds no number and is not being fetched again. */
const FAILED_RATE = { isLoading: false, error: 'Failed to fetch' } as CurrentRate;

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

const otherEthAccount = mockWalletAccount({
    symbol: ETH,
    deviceState: DEVICE_STATE,
    index: 1,
    descriptor: asAccountDescriptor('otherDescriptor'),
    formattedBalance: '10',
});

const PRICED_RATES = {
    [getFiatRateKey(ETH, 'usd')]: mockRate(3000),
    [getFiatRateKey(ETH, 'usd', USDC)]: mockRate(1),
    [getFiatRateKey(ETH, 'usd', ONE_INCH)]: mockRate(0.29),
};

type GetStateOptions = {
    rates: Record<string, CurrentRate>;
    areSmallBalancesShown?: boolean;
    /** What the Earn API says Ethereum staking pays, as a percentage; nothing by default. */
    ethStakingApy?: number;
};

const getState = (
    accounts: Account[],
    { rates, areSmallBalancesShown = true, ethStakingApy }: GetStateOptions,
): MockSuiteState => ({
    ...mockInitialAppState,
    earn: {
        staking: mockStakingState({ positions: { [ethAccount.key]: [HALF_ETH_STAKED] } }),
    },
    networks: mockNetworksState([ETH]),
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
            enabledNetworks: [ETH],
            localCurrency: 'usd',
            areHomeAssetSmallBalancesShown: areSmallBalancesShown,
        },
        fiat: {
            ...mockInitialAppState.wallet.fiat,
            current: rates,
        },
        stake: {
            ...mockInitialAppState.wallet.stake,
            data: {
                ...mockInitialAppState.wallet.stake.data,
                data: {
                    ...mockInitialAppState.wallet.stake.data.data,
                    eth:
                        ethStakingApy === undefined
                            ? undefined
                            : {
                                  stats: { apy: ethStakingApy, nextRewardPayout: 0 },
                                  validators: {},
                              },
                },
            },
        },
    },
});

const renderOverview = (
    accounts: Account[],
    { rates = PRICED_RATES, ...options }: Partial<GetStateOptions> = {},
) => {
    const { services } = createTestCompositionRoot<void, MockSuiteState>({
        preloadedState: getState(accounts, { rates, ...options }),
    });

    renderWithProviders(
        { ...services, networks: { networkIcon: mockNetworkIcon() } },
        <AccountHeaderProvider>
            <AccountAssetOverview accountKey={ethAccount.key} />
        </AccountHeaderProvider>,
    );
};

const rowTestIds = () =>
    screen.getAllByTestId(/^@wallet\/account-asset\//).map(row => row.getAttribute('data-testid'));

describe('the account overview with the asset-first Home', () => {
    it('lists the coin, its stake counted in as Home counts it, and its tokens, the most valuable first', () => {
        renderOverview([ethAccount, otherEthAccount]);

        expect(rowTestIds()).toEqual([
            '@wallet/account-asset/eth/coin',
            `@wallet/account-asset/eth/${USDC}`,
            `@wallet/account-asset/eth/${ONE_INCH}`,
        ]);
        // 1.2 ETH + 0.5 ETH staked at $3,000.
        expect(screen.getByTestId('@wallet/account-asset/eth/coin')).toHaveTextContent(
            /\$5,100.*1\.7\d* ETH/,
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

    it('offers the small-balance switch and, while it is off, leaves the dust out of the rows but in the total', () => {
        renderOverview([ethAccount], { areSmallBalancesShown: false });

        expect(screen.getByTestId('@dashboard/home-asset/grouping')).toBeInTheDocument();
        expect(rowTestIds()).toEqual([
            '@wallet/account-asset/eth/coin',
            `@wallet/account-asset/eth/${USDC}`,
        ]);
        expect(screen.getByTestId('@wallet/account-assets/fiat-amount')).toHaveTextContent(
            '$6,100.61',
        );
        expect(screen.getByTestId('@wallet/account-assets/count')).toHaveTextContent('3 assets');
    });

    it('waits for the rates with a placeholder while nothing is priced yet', () => {
        renderOverview([ethAccount], { rates: {} });

        expect(screen.getByTestId('@wallet/account-assets/skeleton')).toBeInTheDocument();
        expect(screen.queryByTestId('@wallet/account-assets/fiat-amount')).not.toBeInTheDocument();
        expect(screen.queryByTestId('@wallet/account-assets/no-rate')).not.toBeInTheDocument();
    });

    it('says the rate is not available once no asset can be priced', () => {
        renderOverview([ethAccount], {
            rates: {
                [getFiatRateKey(ETH, 'usd')]: FAILED_RATE,
                [getFiatRateKey(ETH, 'usd', USDC)]: FAILED_RATE,
                [getFiatRateKey(ETH, 'usd', ONE_INCH)]: FAILED_RATE,
            },
        });

        expect(screen.getByTestId('@wallet/account-assets/no-rate')).toHaveTextContent(
            messages.TR_FIAT_RATES_NOT_AVAILABLE.defaultMessage,
        );
        expect(screen.queryByTestId('@wallet/account-assets/skeleton')).not.toBeInTheDocument();
        expect(screen.queryByTestId('@wallet/account-assets/fiat-amount')).not.toBeInTheDocument();
    });

    it('marks the total as approximate when an asset it holds cannot be priced', () => {
        renderOverview([ethAccount], {
            rates: {
                [getFiatRateKey(ETH, 'usd')]: FAILED_RATE,
                [getFiatRateKey(ETH, 'usd', USDC)]: mockRate(1),
                [getFiatRateKey(ETH, 'usd', ONE_INCH)]: mockRate(0.29),
            },
        });

        // 1,000 USDC at $1 and 2.1 1INCH at $0.29; the ether is left out.
        expect(screen.getByTestId('@wallet/account-assets/fiat-amount')).toHaveTextContent(
            '$1,000.61',
        );
        expect(
            screen.getByTestId('@wallet/account-assets/fiat-amount/approximate'),
        ).toHaveTextContent('≈');
    });

    it('does not mark a total that every asset is in', () => {
        renderOverview([ethAccount]);

        expect(
            screen.queryByTestId('@wallet/account-assets/fiat-amount/approximate'),
        ).not.toBeInTheDocument();
    });
});
