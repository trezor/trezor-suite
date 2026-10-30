import { asNetworkSymbol } from '@suite-common/wallet-config';
import {
    selectCardanoStakedWithFiveBinariesAccountKey,
    selectStakingListItems,
    selectYieldClaimListItems,
    selectYieldListItems,
    useYieldClaimRewardsWithFiat,
    useYieldOpportunities,
} from '@suite-common/wallet-core';
import { type NativeAnalyticsDep } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { renderWithStoreProvider } from '@suite-native/test-utils-store';
import { mock } from '@trezor/dependency-injection';

import { EarnScreenHeader } from './EarnScreenHeader';
import { selectStakingPromoListSymbols } from '../../earnScreenSelectors';

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
    selectStakingListItems: jest.fn(),
    selectYieldListItems: jest.fn(),
    selectYieldClaimListItems: jest.fn(),
    selectCardanoStakedWithFiveBinariesAccountKey: jest.fn(),
}));
jest.mock('../../earnScreenSelectors', () => ({
    selectStakingPromoListSymbols: jest.fn(),
}));

describe('EarnScreenHeader analytics', () => {
    beforeEach(() => {
        mockIsYieldDisabled = false;
        jest.mocked(selectStakingListItems).mockReturnValue([]);
        jest.mocked(selectStakingPromoListSymbols).mockReturnValue([
            asNetworkSymbol('eth'),
            asNetworkSymbol('ada'),
        ]);
        jest.mocked(selectYieldListItems).mockReturnValue([]);
        jest.mocked(selectYieldClaimListItems).mockReturnValue([]);
        jest.mocked(selectCardanoStakedWithFiveBinariesAccountKey).mockReturnValue(null);
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
        const services: NativeAnalyticsDep = {
            analytics: mockNativeAnalytics(mock<NativeAnalyticsDep['analytics']['report']>()),
        };
        const { toJSON } = await renderWithStoreProvider(<EarnScreenHeader />, { services });

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

    it('reports the staking dashboard even if disabled yield requests fail', async () => {
        mockIsYieldDisabled = true;
        jest.mocked(useYieldOpportunities).mockReturnValue({
            yieldOpportunities: [],
            isLoading: false,
            isError: true,
            refetch: mock(),
        });
        const services: NativeAnalyticsDep = {
            analytics: mockNativeAnalytics(mock<NativeAnalyticsDep['analytics']['report']>()),
        };

        await renderWithStoreProvider(<EarnScreenHeader />, { services });

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
        const services: NativeAnalyticsDep = {
            analytics: mockNativeAnalytics(mock<NativeAnalyticsDep['analytics']['report']>()),
        };

        await renderWithStoreProvider(<EarnScreenHeader />, { services });

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
        const services: NativeAnalyticsDep = {
            analytics: mockNativeAnalytics(mock<NativeAnalyticsDep['analytics']['report']>()),
        };

        await renderWithStoreProvider(<EarnScreenHeader />, { services });

        expect(services.analytics.report).not.toHaveBeenCalled();
    });
});
