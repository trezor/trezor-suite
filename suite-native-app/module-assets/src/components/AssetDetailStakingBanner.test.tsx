import { type useNativeYieldVault } from '@suite-common/earn-stablecoin';
import { type useNetworkStakingRate } from '@suite-common/earn-staking';
import { mockStakingState } from '@suite-common/earn-staking/mocks';
import {
    type StakingPosition,
    stakingAmountSchema,
    stakingProviderIdSchema,
} from '@suite-common/earn-staking-common';
import {
    mockStakingPosition,
    mockStakingProductDescriptor,
} from '@suite-common/earn-staking-common/mocks';
import { messageSystemInitialState } from '@suite-common/message-system';
import { mockNetworksState } from '@suite-common/networks/mocks';
import { type NetworkSymbol, asNetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { transactionsInitialState } from '@suite-common/wallet-core';
import { type Account, type AccountKey, asAccountDescriptor } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { type NativeAnalyticsDep } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { bannerFlagsInitialState } from '@suite-native/banners';
import { getTranslation } from '@suite-native/intl';
import { type AssetsStackParamList, type AssetsStackRoutes } from '@suite-native/navigation';
import {
    createStoreFromPreloadedState,
    fireEvent,
    renderWithStoreProvider,
    screen,
} from '@suite-native/test-utils-store';
import { mock } from '@trezor/dependency-injection';

import { AssetDetailStakingBanner } from './AssetDetailStakingBanner';

const DEVICE_STATE = 'aliceWallet@device:0';
const ETH = asNetworkSymbol('eth');
const SOL = asNetworkSymbol('sol');
const ADA = asNetworkSymbol('ada');
const TRX = asNetworkSymbol('trx');

const mockDispatchNavigation = mock<(action: unknown) => void>();
const mockUseNetworkStakingRate = mock<typeof useNetworkStakingRate>();
const mockUseNativeYieldVault = mock<typeof useNativeYieldVault>();
let mockRouteParams: AssetsStackParamList[AssetsStackRoutes.AssetDetail];

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useRoute: () => ({ params: mockRouteParams }),
    useNavigation: () => ({ dispatch: mockDispatchNavigation }),
}));
jest.mock('@suite-common/earn-staking', () => ({
    ...jest.requireActual('@suite-common/earn-staking'),
    useNetworkStakingRate: (...args: Parameters<typeof useNetworkStakingRate>) =>
        mockUseNetworkStakingRate(...args),
}));
jest.mock('@suite-common/earn-stablecoin', () => ({
    ...jest.requireActual('@suite-common/earn-stablecoin'),
    useNativeYieldVault: (...args: Parameters<typeof useNativeYieldVault>) =>
        mockUseNativeYieldVault(...args),
}));

const toBaseUnits = (networkSymbol: NetworkSymbol, wholeCoins: string) =>
    `${wholeCoins}${'0'.repeat(getNetwork(networkSymbol).decimals)}`;

const mockAccount = (networkSymbol: NetworkSymbol, formattedBalance = '10'): Account =>
    mockWalletAccount({
        symbol: networkSymbol,
        deviceState: DEVICE_STATE,
        formattedBalance,
        availableBalance: toBaseUnits(networkSymbol, formattedBalance),
    });

const { limits: ETH_LIMITS } = mockStakingProductDescriptor();

// Every product under test takes a stake from 1 unit of its coin; Cardano also keeps a 2 ADA deposit.
const mockLimits = (networkSymbol: NetworkSymbol, registrationDeposit?: string) => ({
    ...ETH_LIMITS,
    minStakeAmount: stakingAmountSchema.parse(toBaseUnits(networkSymbol, '1')),
    minStakeAmountForDashboard: stakingAmountSchema.parse(toBaseUnits(networkSymbol, '1')),
    registrationDeposit:
        registrationDeposit === undefined
            ? ETH_LIMITS.registrationDeposit
            : stakingAmountSchema.parse(toBaseUnits(networkSymbol, registrationDeposit)),
});

const ADA_STAKING_PRODUCT = mockStakingProductDescriptor({
    networkSymbol: ADA,
    type: 'native',
    operations: ['stake', 'unstake', 'claim', 'vote'],
    limits: mockLimits(ADA, '2'),
});

const STAKING_PRODUCTS = [
    mockStakingProductDescriptor({ limits: mockLimits(ETH) }),
    mockStakingProductDescriptor({
        networkSymbol: SOL,
        type: 'native',
        operations: ['stake', 'unstake', 'withdraw'],
        rewardsKind: 'expected',
        limits: mockLimits(SOL),
    }),
    ADA_STAKING_PRODUCT,
    mockStakingProductDescriptor({
        networkSymbol: TRX,
        providerId: stakingProviderIdSchema.parse('curated'),
        type: 'native',
        operations: ['stake', 'unstake', 'withdraw', 'claim', 'vote'],
        rateKind: 'apr',
        rewardsKind: 'claimable',
        limits: mockLimits(TRX),
    }),
];

const mockCardanoAccount = (descriptor: string): Account =>
    mockWalletAccount({
        symbol: ADA,
        deviceState: DEVICE_STATE,
        formattedBalance: '10',
        availableBalance: toBaseUnits(ADA, '10'),
        descriptor: asAccountDescriptor(descriptor),
    });

const mockDelegation = (): StakingPosition =>
    mockStakingPosition({
        productId: ADA_STAKING_PRODUCT.id,
        lockup: 'liquid',
        balances: {
            staked: stakingAmountSchema.parse('10000000'),
            pending: stakingAmountSchema.parse('0'),
            unstaking: stakingAmountSchema.parse('0'),
            withdrawable: stakingAmountSchema.parse('0'),
            rewards: stakingAmountSchema.parse('0'),
        },
        unlocks: [],
        operations: ['unstake', 'claim', 'vote'],
    });

type RenderStakingBannerParams = {
    accounts: Account[];
    stakingPositions?: Partial<Record<AccountKey, readonly StakingPosition[]>>;
    stakingRate?: number;
    closedEarnBannerSymbols?: NetworkSymbol[];
    isDiscreetMode?: boolean;
};

const renderStakingBanner = async ({
    accounts,
    stakingPositions = {},
    stakingRate,
    closedEarnBannerSymbols = [],
    isDiscreetMode = false,
}: RenderStakingBannerParams) => {
    const [account] = accounts;

    if (account === undefined) {
        throw new Error('Render the banner with at least one account');
    }

    mockRouteParams = { networkSymbol: account.symbol };
    mockUseNetworkStakingRate.mockImplementation(params => ({
        rate: stakingRate ?? null,
        rateKind: params.networkSymbol === asNetworkSymbol('trx') ? 'apr' : 'apy',
        isPending: false,
    }));

    const store = createStoreFromPreloadedState({
        networks: mockNetworksState([account.symbol]),
        discreetMode: { isActive: isDiscreetMode },
        device: { selectedDevice: { state: { staticSessionId: DEVICE_STATE } } },
        earn: {
            staking: mockStakingState({
                platform: 'mobile',
                descriptors: STAKING_PRODUCTS,
                positions: stakingPositions,
            }),
        },
        wallet: {
            accounts,
            transactions: transactionsInitialState,
        },
        messageSystem: messageSystemInitialState,
        bannerFlags: { ...bannerFlagsInitialState, closedEarnBannerSymbols },
    });
    const analyticsServices: NativeAnalyticsDep = { analytics: mockNativeAnalytics() };

    await renderWithStoreProvider(<AssetDetailStakingBanner />, {
        services: { store, ...analyticsServices },
    });

    return analyticsServices;
};

const exploreButtonLabel = getTranslation('earn.promoStakeBanner.exploreButton');

describe('AssetDetailStakingBanner', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockUseNativeYieldVault.mockReturnValue({ hasYieldOption: false, bestVault: null });
    });

    it('promotes the yearly rewards of an asset with an account that is not staking', async () => {
        await renderStakingBanner({ accounts: [mockAccount(SOL)], stakingRate: 5 });

        expect(
            screen.getByText(
                getTranslation('moduleAssets.assetDetailScreen.stakingBanner.title', {
                    apy: '5',
                    symbol: 'SOL',
                }),
            ),
        ).toBeTruthy();
        expect(
            screen.getByText(
                getTranslation(
                    'moduleAssets.assetDetailScreen.stakingBanner.descriptionWithRewards',
                    { potentialRewards: '0.5', symbol: 'SOL' },
                ),
            ),
        ).toBeTruthy();
    });

    it('redacts the yearly rewards in discreet mode', async () => {
        await renderStakingBanner({
            accounts: [mockAccount(SOL)],
            stakingRate: 5,
            isDiscreetMode: true,
        });

        expect(
            screen.getByText(
                getTranslation(
                    'moduleAssets.assetDetailScreen.stakingBanner.descriptionWithRewards',
                    { potentialRewards: '###', symbol: 'SOL' },
                ),
            ),
        ).toBeTruthy();
    });

    it('promotes staking in general when no rewards can be estimated', async () => {
        await renderStakingBanner({ accounts: [mockAccount(SOL)] });

        expect(
            screen.getByText(
                getTranslation('moduleAssets.assetDetailScreen.stakingBanner.description', {
                    symbol: 'SOL',
                }),
            ),
        ).toBeTruthy();
    });

    it('names the Tron rate an APR', async () => {
        await renderStakingBanner({ accounts: [mockAccount(TRX)], stakingRate: 4 });

        expect(
            screen.getByText(
                getTranslation('moduleAssets.assetDetailScreen.stakingBanner.titleApr', {
                    apr: '4',
                    symbol: 'TRX',
                }),
            ),
        ).toBeTruthy();
        expect(
            screen.getByText(
                getTranslation(
                    'moduleAssets.assetDetailScreen.stakingBanner.descriptionWithRewardsApr',
                    { potentialRewards: '0.4', symbol: 'TRX' },
                ),
            ),
        ).toBeTruthy();
    });

    it('promotes staking or a vault deposit for ETH with a yield vault', async () => {
        mockUseNativeYieldVault.mockReturnValue({
            hasYieldOption: true,
            bestVault: { id: 'weth-vault', apy: 4 },
        });

        await renderStakingBanner({ accounts: [mockAccount(ETH)], stakingRate: 3 });

        expect(
            screen.getByText(
                getTranslation('earn.promoStakeBanner.eth.description', { symbol: 'ETH' }),
            ),
        ).toBeTruthy();
    });

    it('opens Earn from the explore button', async () => {
        const { analytics } = await renderStakingBanner({ accounts: [mockAccount(SOL)] });

        fireEvent.press(screen.getByText(exploreButtonLabel));

        expect(mockDispatchNavigation).toHaveBeenCalledTimes(1);
        expect(analytics.report).toHaveBeenCalledWith({
            type: 'navigate/flow',
            payload: { action: 'navigate', type: 'earn', from: 'asset-detail', networkSymbol: SOL },
        });
    });

    it('stays visible while one of the accounts is not staking', async () => {
        const delegating = mockCardanoAccount('delegatingAda');

        await renderStakingBanner({
            accounts: [delegating, mockCardanoAccount('idleAda')],
            stakingPositions: { [delegating.key]: [mockDelegation()] },
        });

        expect(screen.getByText(exploreButtonLabel)).toBeTruthy();
    });

    it('stays hidden once every account is staking', async () => {
        const delegating = mockCardanoAccount('delegatingAda');

        await renderStakingBanner({
            accounts: [delegating],
            stakingPositions: { [delegating.key]: [mockDelegation()] },
        });

        expect(screen.queryByText(exploreButtonLabel)).toBeNull();
    });

    it('stays hidden once the banner was dismissed for the network', async () => {
        await renderStakingBanner({ accounts: [mockAccount(SOL)], closedEarnBannerSymbols: [SOL] });

        expect(screen.queryByText(exploreButtonLabel)).toBeNull();
    });

    it('stays hidden for an asset that cannot be staked', async () => {
        await renderStakingBanner({ accounts: [mockAccount(asNetworkSymbol('btc'))] });

        expect(screen.queryByText(exploreButtonLabel)).toBeNull();
    });
});
