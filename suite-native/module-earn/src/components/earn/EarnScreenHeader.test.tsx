import { mockStakingState } from '@suite-common/earn-staking/mocks';
import { stakingAmountSchema, stakingProviderIdSchema } from '@suite-common/earn-staking-common';
import {
    mockStakingPosition,
    mockStakingProductDescriptor,
} from '@suite-common/earn-staking-common/mocks';
import { mockNetworksState } from '@suite-common/networks/mocks';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import {
    selectYieldClaimListItems,
    selectYieldListItems,
    useYieldClaimRewardsWithFiat,
    useYieldOpportunities,
} from '@suite-common/wallet-core';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { type NativeAnalyticsDep } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { renderWithStoreProvider } from '@suite-native/test-utils-store';
import { mock } from '@trezor/dependency-injection';
import { type StaticSessionId } from '@trezor/device-utils';

import { EarnScreenHeader } from './EarnScreenHeader';
import { selectStakingPromoListDescriptors } from '../../earnScreenSelectors';

let mockIsYieldDisabled = false;

jest.mock('@suite-native/navigation', () => ({
    ...jest.requireActual('@suite-native/navigation'),
    useEarnEntryId: () => 1,
}));

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useIsFocused: () => true,
}));

jest.mock('../../hooks/earn/useMessageSystemEarnDashboard', () => ({
    useMessageSystemEarnDashboard: (type: string) => ({
        isDisabled: type === 'yield' && mockIsYieldDisabled,
    }),
}));
jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    useYieldOpportunities: jest.fn(),
    useYieldClaimRewardsWithFiat: jest.fn(),
    selectYieldListItems: jest.fn(),
    selectYieldClaimListItems: jest.fn(),
}));
jest.mock('../../earnScreenSelectors', () => ({
    selectStakingPromoListDescriptors: jest.fn(),
}));
jest.mock('./EarnBalanceCard', () => ({ EarnBalanceCard: () => null }));
jest.mock('../staking/StakingPositionsCard', () => ({ StakingPositionsCard: () => null }));
jest.mock('../yield/YieldPositionsCard', () => ({ YieldPositionsCard: () => null }));

const deviceState: StaticSessionId = 'selectedWallet@deviceId:0';
const selectedDevice = mockSuiteDevice({ state: { staticSessionId: deviceState } });
const eth = asNetworkSymbol('eth');
const ada = asNetworkSymbol('ada');
const zero = stakingAmountSchema.parse('0');

const ethProduct = mockStakingProductDescriptor({
    platforms: { desktop: { access: 'manage' }, mobile: { access: 'manage' } },
});
const fivebinaries = mockStakingProductDescriptor({
    networkSymbol: ada,
    providerId: stakingProviderIdSchema.parse('fivebinaries'),
    type: 'native',
    operations: ['unstake', 'claim', 'vote'],
    consentKey: null,
    platforms: { desktop: { access: 'manage' }, mobile: { access: 'read-only' } },
});
const ethAccount = mockWalletAccount({ symbol: eth, deviceState });
const adaAccount = mockWalletAccount({ symbol: ada, deviceState, availableBalance: '5000000' });

const fivebinariesPosition = mockStakingPosition({
    productId: fivebinaries.id,
    lockup: 'liquid',
    balances: {
        staked: stakingAmountSchema.parse('5000000'),
        pending: zero,
        unstaking: zero,
        withdrawable: zero,
        rewards: zero,
    },
    unlocks: [],
    targets: [],
    operations: ['unstake', 'claim', 'vote'],
    warnings: [{ code: 'outdated-provider', providerId: fivebinaries.providerId }],
});

const createPreloadedState = ({ hasPositions }: { hasPositions: boolean }) => ({
    device: { devices: [selectedDevice], selectedDevice },
    wallet: { accounts: [ethAccount, adaAccount] },
    networks: mockNetworksState([eth, ada]),
    earn: {
        staking: mockStakingState({
            platform: 'mobile',
            descriptors: [ethProduct, fivebinaries],
            positions: hasPositions
                ? {
                      [ethAccount.key]: [mockStakingPosition({ productId: ethProduct.id })],
                      [adaAccount.key]: [fivebinariesPosition],
                  }
                : {},
        }),
    },
});

const createServices = (): NativeAnalyticsDep => ({
    analytics: mockNativeAnalytics(mock<NativeAnalyticsDep['analytics']['report']>()),
});

describe('EarnScreenHeader', () => {
    beforeEach(() => {
        mockIsYieldDisabled = false;
        jest.mocked(selectStakingPromoListDescriptors).mockReturnValue([
            mockStakingProductDescriptor(),
            mockStakingProductDescriptor({ networkSymbol: ada, type: 'native' }),
        ]);
        jest.mocked(selectYieldListItems).mockReturnValue([]);
        jest.mocked(selectYieldClaimListItems).mockReturnValue([]);
        jest.mocked(useYieldOpportunities).mockReturnValue({
            yieldOpportunities: [],
            isLoading: false,
            isError: false,
            refetch: mock(),
        });
        jest.mocked(useYieldClaimRewardsWithFiat).mockReturnValue({
            claimRewardsWithFiat: [],
            isClaimLoading: false,
            isClaimError: false,
        });
    });

    it('reports a ready dashboard even when no positions or rewards render the header', async () => {
        const services = createServices();
        const { toJSON } = await renderWithStoreProvider(<EarnScreenHeader />, {
            preloadedState: createPreloadedState({ hasPositions: false }),
            services,
        });

        expect(toJSON()).toBeNull();
        expect(services.analytics.report).toHaveBeenCalledTimes(1);
        expect(services.analytics.report).toHaveBeenCalledWith({
            type: 'earn/dashboard-ready',
            payload: {
                hasClaimBanner: false,
                hasYieldPosition: false,
                hasStakingPosition: false,
                availableVaultCount: 0,
                availableStakingCount: 2,
                hasShowMore: false,
            },
        });
    });

    it('counts the staking positions of the device and shows the banner of an outdated provider', async () => {
        const services = createServices();
        const { getByTestId } = await renderWithStoreProvider(<EarnScreenHeader />, {
            preloadedState: createPreloadedState({ hasPositions: true }),
            services,
        });

        expect(getByTestId('@staking/cardano-not-earning-banner')).toBeTruthy();
        expect(services.analytics.report).toHaveBeenCalledWith({
            type: 'earn/dashboard-ready',
            payload: {
                hasClaimBanner: false,
                hasYieldPosition: false,
                hasStakingPosition: true,
                availableVaultCount: 0,
                availableStakingCount: 2,
                hasShowMore: false,
            },
        });
    });

    it('reports the staking dashboard even if disabled yield requests fail', async () => {
        mockIsYieldDisabled = true;
        jest.mocked(useYieldOpportunities).mockReturnValue({
            yieldOpportunities: [],
            isLoading: false,
            isError: true,
            refetch: mock(),
        });
        const services = createServices();

        await renderWithStoreProvider(<EarnScreenHeader />, {
            preloadedState: createPreloadedState({ hasPositions: false }),
            services,
        });

        expect(services.analytics.report).toHaveBeenCalledTimes(1);
        expect(services.analytics.report).toHaveBeenCalledWith({
            type: 'earn/dashboard-ready',
            payload: {
                hasClaimBanner: false,
                hasYieldPosition: false,
                hasStakingPosition: false,
                availableVaultCount: 0,
                availableStakingCount: 2,
                hasShowMore: false,
            },
        });
    });

    it.each([
        { isLoading: true, isError: false },
        { isLoading: false, isError: true },
    ])('waits for successful opportunities ($isLoading, $isError)', async status => {
        jest.mocked(useYieldOpportunities).mockReturnValue({
            yieldOpportunities: [],
            refetch: mock(),
            ...status,
        });
        const services = createServices();

        await renderWithStoreProvider(<EarnScreenHeader />, {
            preloadedState: createPreloadedState({ hasPositions: false }),
            services,
        });

        expect(services.analytics.report).not.toHaveBeenCalled();
    });

    it.each([
        { isClaimLoading: true, isClaimError: false },
        { isClaimLoading: false, isClaimError: true },
    ])('waits for successful rewards ($isClaimLoading, $isClaimError)', async status => {
        jest.mocked(useYieldClaimRewardsWithFiat).mockReturnValue({
            claimRewardsWithFiat: [],
            ...status,
        });
        const services = createServices();

        await renderWithStoreProvider(<EarnScreenHeader />, {
            preloadedState: createPreloadedState({ hasPositions: false }),
            services,
        });

        expect(services.analytics.report).not.toHaveBeenCalled();
    });
});
