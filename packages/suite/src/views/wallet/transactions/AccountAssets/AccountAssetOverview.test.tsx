import '@suite-common/test-utils/globalOverrides';

import { screen } from '@testing-library/react';

import { initialState as selectedAccountInitialState } from '@suite/account';
import { messages } from '@suite/intl';
import { mockNetworkIcon, mockNetworksState } from '@suite-common/networks/mocks';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { type TokenAddress } from '@suite-common/tokens';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type Account, type CurrentRate, asAccountDescriptor } from '@suite-common/wallet-types';
import { mockAccountToken, mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { getFiatRateKey } from '@suite-common/wallet-utils';
import { type StaticSessionId } from '@trezor/device-utils';

import { type AppState } from 'src/reducers/store';
import { AccountHeaderProvider } from 'src/support/suite/AccountHeaderProvider';
import { renderWithProviders } from 'src/support/test-utils/hooksHelper';

import { AccountAssetOverview } from './AccountAssetOverview';
import { mockInitialAppState } from '../../../../../mocks/mockInitialAppState';

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

const stakingPool = {
    name: 'Everstake',
    autocompoundBalance: '500000000000000000',
    pendingBalance: '0',
    pendingDepositedBalance: '0',
    withdrawTotalAmount: '0',
    claimableAmount: '0',
    depositedBalance: '0',
    restakedReward: '0',
};

const ethAccount = mockWalletAccount(
    {
        symbol: ETH,
        deviceState: DEVICE_STATE,
        formattedBalance: '1.2',
        tokens: [
            mockAccountToken({ symbol: 'USDC', contract: USDC, balance: '1000', decimals: 6 }),
            mockAccountToken({ symbol: '1INCH', contract: ONE_INCH, balance: '2.1', decimals: 18 }),
        ],
    },
    { misc: { stakingPools: [stakingPool] } },
);

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
): AppState => ({
    ...mockInitialAppState,
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
    const { services } = createTestCompositionRoot<void, AppState>({
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
    it('lists the coin it can spend, its stake and its tokens, the most valuable first', () => {
        renderOverview([ethAccount, otherEthAccount]);

        expect(rowTestIds()).toEqual([
            '@wallet/account-asset/coin/eth',
            '@wallet/account-asset/staking/eth',
            `@wallet/account-asset/token/${USDC}`,
            `@wallet/account-asset/token/${ONE_INCH}`,
        ]);
        expect(screen.getByTestId('@wallet/account-asset/coin/eth')).toHaveTextContent(
            /\$3,600.*1\.2\d* ETH/,
        );
        expect(screen.getByTestId('@wallet/account-asset/staking/eth')).toHaveTextContent(
            new RegExp(`${messages.TR_EARN_STAKING.defaultMessage}.*\\$1,500.*0\\.5\\d* ETH`),
        );
    });

    it('reads the stake as Earn does: its rate, and what a year of it would add', () => {
        renderOverview([ethAccount], { ethStakingApy: 3.2 });

        const stakingRow = screen.getByTestId('@wallet/account-asset/staking/eth');

        expect(stakingRow).toHaveTextContent('~3.2%');
        // 0.5 ETH staked at 3.2% for a year.
        expect(screen.getByTestId('@wallet/account-asset/staking/rewards')).toHaveTextContent(
            /^0\.016\d* ETH$/,
        );
    });

    it('totals this account alone, its stake included', () => {
        renderOverview([ethAccount, otherEthAccount]);

        // 1.2 ETH + 0.5 ETH staked at $3,000, 1,000 USDC at $1 and 2.1 1INCH at $0.29.
        expect(screen.getByTestId('@wallet/account-assets/fiat-amount')).toHaveTextContent(
            '$6,100.61',
        );
    });

    it('offers the small-balance switch and, while it is off, leaves the dust out of the rows but in the total', () => {
        renderOverview([ethAccount], { areSmallBalancesShown: false });

        expect(screen.getByTestId('@dashboard/home-asset/grouping')).toBeInTheDocument();
        expect(rowTestIds()).toEqual([
            '@wallet/account-asset/coin/eth',
            '@wallet/account-asset/staking/eth',
            `@wallet/account-asset/token/${USDC}`,
        ]);
        expect(screen.getByTestId('@wallet/account-assets/fiat-amount')).toHaveTextContent(
            '$6,100.61',
        );
    });

    it('stands the coin, its stake included, in for the total while nothing can be priced', () => {
        renderOverview([ethAccount], { rates: {} });

        expect(screen.queryByTestId('@wallet/account-assets/fiat-amount')).not.toBeInTheDocument();
        // 1.2 ETH + 0.5 ETH staked; the token is not counted in the coin's amount.
        expect(screen.getByTestId('@wallet/account-assets/crypto-amount')).toHaveTextContent(
            /^1\.7\d*$/,
        );
    });
});
