import '@suite-common/test-utils/globalOverrides';

import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { messages } from '@suite/intl';
import { initialMetadataState } from '@suite/metadata';
import { mockStakingState } from '@suite-common/earn-staking/mocks';
import { type StakingPosition, stakingAmountSchema } from '@suite-common/earn-staking-common';
import {
    mockStakingPosition,
    mockStakingProductDescriptor,
} from '@suite-common/earn-staking-common/mocks';
import { mockNetworkIcon, mockNetworksState } from '@suite-common/networks/mocks';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { type TokenAddress } from '@suite-common/tokens';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import {
    type Account,
    type AccountKey,
    type CurrentRate,
    type Timestamp,
} from '@suite-common/wallet-types';
import {
    mockAccountToken,
    mockCardanoStakingAccount,
    mockEthereumStakingAccount,
    mockSolanaStakingAccount,
    mockTronStakingAccount,
    mockWalletAccount,
} from '@suite-common/wallet-types/mocks';
import { getFiatRateKey } from '@suite-common/wallet-utils';
import { mock } from '@trezor/dependency-injection';

import { type useGoToWithAnalytics } from '#src/components/suite/layouts/SuiteLayout/PageHeader/useGoToWithAnalytics';
import { SIDEBAR_MIN_WIDTH } from '#src/components/suite/layouts/SuiteLayout/Sidebar/consts';
import { renderWithProviders } from '#src/support/test-utils/hooksHelper';

import { AccountSection } from './AccountSection';
import { type MockSuiteState, mockInitialAppState } from '../../../../../mocks/mockInitialAppState';

const mockNavigate = mock<ReturnType<typeof useGoToWithAnalytics>>();

jest.mock('#src/components/suite/layouts/SuiteLayout/PageHeader/useGoToWithAnalytics', () => ({
    useGoToWithAnalytics: () => mockNavigate,
}));

const ETH = asNetworkSymbol('eth');
const USDT = '0xdac17f958d2ee523a2206206994597c13d831ec7' as TokenAddress;
const token = mockAccountToken({ contract: USDT, balance: '250' });
const ethAccount = mockEthereumStakingAccount('none', { tokens: [token] });
const networkIcon = mockNetworkIcon();
const tokenCountLabel = '+1';

const ETH_STAKING_PRODUCT = mockStakingProductDescriptor();
const ADA_STAKING_PRODUCT = mockStakingProductDescriptor({
    networkSymbol: asNetworkSymbol('ada'),
    type: 'native',
    operations: ['stake', 'unstake', 'claim', 'vote'],
    rewardsKind: 'claimable',
});

const amount = (value: string) => stakingAmountSchema.parse(value);

const zeroBalances = {
    staked: amount('0'),
    pending: amount('0'),
    unstaking: amount('0'),
    withdrawable: amount('0'),
    rewards: amount('0'),
};

/** 2.05 ether with Everstake, on top of the account balance. */
const mockEthereumStake = () =>
    mockStakingPosition({
        balances: { ...zeroBalances, staked: amount('2050000000000000000') },
        unlocks: [],
    });

const mockCardanoDelegation = () =>
    mockStakingPosition({
        productId: ADA_STAKING_PRODUCT.id,
        lockup: 'liquid',
        balances: { ...zeroBalances, staked: amount('1000000000') },
        unlocks: [],
        operations: ['unstake', 'claim', 'vote'],
    });

const createRate = (rate: number | undefined, isLoading = false): CurrentRate => {
    const status = {
        lastTickerTimestamp: 1700000000000 as Timestamp,
        lastSuccessfulFetchTimestamp: 1700000000000 as Timestamp,
        isLoading,
        error: null,
        ticker: { symbol: ETH },
    };

    return rate === undefined ? status : { ...status, rate, usdRate: rate };
};

type RenderAccountParams = {
    account?: Account;
    tokens?: Account['tokens'];
    tokenRate?: CurrentRate;
    nativeRate?: CurrentRate;
    isCollapsed?: boolean;
    isDiscreetMode?: boolean;
    stakingPositions?: Partial<Record<AccountKey, readonly StakingPosition[]>>;
};

const renderAccount = ({
    account = ethAccount,
    tokens = account.tokens ?? [],
    tokenRate = createRate(1),
    nativeRate = createRate(2000),
    isCollapsed = false,
    isDiscreetMode = false,
    stakingPositions = {},
}: RenderAccountParams = {}) => {
    const state: MockSuiteState = {
        ...mockInitialAppState,
        earn: {
            staking: mockStakingState({
                descriptors: [ETH_STAKING_PRODUCT, ADA_STAKING_PRODUCT],
                positions: stakingPositions,
            }),
        },
        metadata: initialMetadataState,
        networks: mockNetworksState([account.symbol]),
        suiteSettings: {
            ...mockInitialAppState.suiteSettings,
            sidebarWidth: isCollapsed ? SIDEBAR_MIN_WIDTH : 280,
        },
        discreetMode: { isActive: isDiscreetMode },
        wallet: {
            ...mockInitialAppState.wallet,
            accounts: [account],
            settings: { ...mockInitialAppState.wallet.settings, localCurrency: 'usd' },
            fiat: {
                ...mockInitialAppState.wallet.fiat,
                current: {
                    [getFiatRateKey(account.symbol, 'usd')]: nativeRate,
                    [getFiatRateKey(ETH, 'usd', USDT)]: tokenRate,
                },
            },
        },
    };
    const { services } = createTestCompositionRoot<void, MockSuiteState>({ preloadedState: state });

    return renderWithProviders(
        { ...services, networks: { networkIcon } },
        <AccountSection account={account} tokens={tokens} selected />,
    );
};

describe('compact account sidebar', () => {
    it('shows one account row with its token count and total fiat balance', () => {
        const { container } = renderAccount();

        expect(screen.getAllByRole('button')).toHaveLength(1);
        expect(container).toHaveTextContent('$3,250');
        expect(screen.getByText(tokenCountLabel)).toBeInTheDocument();
        expect(screen.queryByTestId('@wallet/coin-balance/value-eth')).not.toBeInTheDocument();
        expect(screen.queryByTestId('@account-menu/eth/normal/0/tokens')).not.toBeInTheDocument();
    });

    it.each([false, true])(
        'keeps compact fiat rounding when collapsed is %s',
        async isCollapsed => {
            renderAccount({
                nativeRate: createRate(2000.1),
                tokenRate: createRate(1.001),
                isCollapsed,
            });

            if (isCollapsed) {
                await userEvent.hover(screen.getByRole('button'));
            }

            expect(await screen.findByText('$3,250')).toBeInTheDocument();
        },
    );

    it('excludes tokens omitted from the visible list from the total', () => {
        const { container } = renderAccount({ tokens: [] });

        expect(container).toHaveTextContent('$3,000');
        expect(screen.getByTestId('@wallet/coin-balance/value-eth')).toBeInTheDocument();
        expect(screen.queryByText(tokenCountLabel)).not.toBeInTheDocument();
    });

    it('includes staking and tokens in the same total', () => {
        const account = mockEthereumStakingAccount('active', { tokens: [token] });
        const { container } = renderAccount({
            account,
            stakingPositions: { [account.key]: [mockEthereumStake()] },
        });

        expect(container).toHaveTextContent('$7,350');
        expect(
            screen.getByRole('img', { name: messages.TR_EARN_STAKING.defaultMessage }),
        ).toBeInTheDocument();
        expect(screen.getAllByRole('button')).toHaveLength(1);
    });

    it.each([
        mockEthereumStakingAccount('pending'),
        mockEthereumStakingAccount('claimable'),
        mockSolanaStakingAccount('active'),
        mockCardanoStakingAccount('everstake'),
        mockTronStakingAccount('frozenNotVoted'),
    ])('keeps a staking indicator for $symbol', account => {
        renderAccount({ account });

        expect(screen.getByTestId('@account-menu/staking/badge')).toBeInTheDocument();
        expect(screen.getAllByRole('button')).toHaveLength(1);
        expect(
            screen.queryByTestId(`@wallet/coin-balance/value-${account.symbol}`),
        ).not.toBeInTheDocument();
    });

    it('includes staking in the total even without tokens', () => {
        const account = mockEthereumStakingAccount('active');
        const { container } = renderAccount({
            account,
            stakingPositions: { [account.key]: [mockEthereumStake()] },
        });

        expect(container).toHaveTextContent('$7,100');
        expect(screen.queryByTestId('@wallet/coin-balance/value-eth')).not.toBeInTheDocument();
    });

    it('does not double-count delegated Cardano', () => {
        const account = mockCardanoStakingAccount('everstake');
        const { container } = renderAccount({
            account,
            stakingPositions: { [account.key]: [mockCardanoDelegation()] },
        });

        expect(container).toHaveTextContent('$2,000,000');
    });

    it('shows the no-rewards warning inline and in its tooltip', async () => {
        renderAccount({ account: mockCardanoStakingAccount('fiveBinaries') });
        const label = messages.TR_STAKING_REWARDS_REDUCED.defaultMessage;
        const badge = screen.getByRole('img', { name: label });

        expect(screen.getByText(label)).toBeInTheDocument();

        await userEvent.hover(badge);

        expect(await screen.findByRole('tooltip')).toHaveTextContent(label);
    });

    it.each([false, true])(
        'keeps a neutral staking indicator for a registered Cardano key without a pool (DRep: %s)',
        hasDrep => {
            const account = mockCardanoStakingAccount('everstake');
            account.misc.staking = {
                ...account.misc.staking,
                poolId: null,
                drep: hasDrep ? account.misc.staking.drep : null,
            };

            renderAccount({ account });

            expect(
                screen.getByRole('img', { name: messages.TR_EARN_STAKING.defaultMessage }),
            ).toBeInTheDocument();
            expect(
                screen.queryByRole('img', {
                    name: messages.TR_STAKING_DIFFERENT_PROVIDER.defaultMessage,
                }),
            ).not.toBeInTheDocument();
        },
    );

    it.each([false, true])(
        'explains staking warnings on keyboard focus and dismisses with Escape when collapsed is %s',
        async isCollapsed => {
            renderAccount({ account: mockCardanoStakingAccount('fiveBinaries'), isCollapsed });
            const label = messages.TR_STAKING_REWARDS_REDUCED.defaultMessage;

            await userEvent.tab();

            expect(screen.getByRole('button')).toHaveFocus();
            expect(await screen.findByRole('tooltip', { name: label })).toHaveTextContent(label);
            expect(screen.getAllByRole('button')).toHaveLength(1);

            await userEvent.keyboard('{Escape}');

            await waitFor(() =>
                expect(screen.queryByRole('tooltip', { name: label })).not.toBeInTheDocument(),
            );
        },
    );

    it.each([
        {
            account: mockCardanoStakingAccount('externalPool'),
            label: messages.TR_STAKING_DIFFERENT_PROVIDER.defaultMessage,
        },
        {
            account: mockTronStakingAccount('frozenNotVoted'),
            label: messages.TR_EARN_STAKING_DASHBOARD_REMAINING_VOTES_NO_APR.defaultMessage,
        },
    ])('explains the staking warning for $account.symbol', async ({ account, label }) => {
        renderAccount({ account });
        const badge = screen.getByRole('img', { name: label });

        expect(screen.queryByText(label)).not.toBeInTheDocument();

        await userEvent.hover(badge);

        expect(await screen.findByRole('tooltip')).toHaveTextContent(label);
    });

    it('does not show an incomplete fiat total while a visible token rate loads', () => {
        const { container } = renderAccount({ tokenRate: createRate(undefined, true) });

        expect(container).not.toHaveTextContent('$3,000');
        expect(container.querySelector('[data-component="Skeleton"]')).toBeInTheDocument();
    });

    it('ignores loading rates for tokens omitted from the visible list', () => {
        const { container } = renderAccount({ tokens: [], tokenRate: createRate(undefined, true) });

        expect(container).toHaveTextContent('$3,000');
        expect(container.querySelector('[data-component="Skeleton"]')).not.toBeInTheDocument();
    });

    it.each([undefined, 0])(
        'does not present token fiat as a total without the native rate (%s)',
        rate => {
            const { container } = renderAccount({ nativeRate: createRate(rate) });

            expect(container).not.toHaveTextContent('$');
            expect(screen.getByText(tokenCountLabel)).toBeInTheDocument();
        },
    );

    it('keeps failed accounts visible without a crypto balance', () => {
        renderAccount({
            account: mockWalletAccount({ symbol: asNetworkSymbol('btc') }, undefined, {
                failed: true,
                error: 'Backend unavailable',
            }),
        });

        expect(screen.getAllByRole('button')).toHaveLength(1);
        expect(screen.queryByTestId('@wallet/coin-balance/value-btc')).not.toBeInTheDocument();
        expect(screen.getByTestId('@account-menu/account/error')).toBeInTheDocument();
    });

    it('opens the account overview from the account row', async () => {
        renderAccount();

        await userEvent.click(screen.getByRole('button'));

        expect(mockNavigate).toHaveBeenCalledWith({
            routeName: 'wallet-index',
            params: { symbol: ETH, accountIndex: 0, accountType: 'normal' },
        });
    });

    it('keeps a single icon in the collapsed sidebar', () => {
        renderAccount({ isCollapsed: true });

        expect(screen.getAllByRole('button')).toHaveLength(1);
        expect(screen.queryByText(tokenCountLabel)).not.toBeInTheDocument();
    });

    it.each([false, true])(
        'keeps the same Ledger information when collapsed is %s',
        async isCollapsed => {
            renderAccount({
                account: mockEthereumStakingAccount('active', {
                    accountType: 'ledger',
                    tokens: [token],
                }),
                isCollapsed,
            });

            if (isCollapsed) {
                await userEvent.hover(screen.getByRole('button'));
            }

            expect(
                await screen.findByText(messages.TR_ACCOUNT_TYPE_LEDGER.defaultMessage),
            ).toBeInTheDocument();
            expect(
                screen.getByRole('img', { name: messages.TR_EARN_STAKING.defaultMessage }),
            ).toBeInTheDocument();
            expect(screen.getByText(tokenCountLabel)).toBeInTheDocument();
        },
    );

    it('hides the aggregated fiat value in discreet mode', () => {
        const { container } = renderAccount({ isDiscreetMode: true });

        expect(container).not.toHaveTextContent('$3,250');
    });
});
