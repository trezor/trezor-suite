import { type PropsWithChildren } from 'react';

import { render } from '@testing-library/react';

import { type DesktopAnalyticsDep } from '@suite/analytics';
import { mockDesktopAnalytics } from '@suite/analytics/mocks';
import { useGetMerklRewards } from '@suite-common/earn-stablecoin-api';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { ServicesProvider, mock } from '@trezor/dependency-injection';
import { type Dispatch, type DispatchDep } from '@trezor/redux-utils';

import { type AppState } from 'src/reducers/store';

import { EarnYieldTable } from './EarnYieldTable';
import { mockInitialAppState } from '../../../../../mocks/mockInitialAppState';
import { type YieldDashboardReadyPayload } from '../useReportEarnDashboardReadyEvent';

let mockYieldAccounts: Account[] = [];
const mockRewardsQueryState: ReturnType<typeof useGetMerklRewards> = {
    data: undefined,
    error: null,
    isLoading: false,
    isError: false,
    isSuccess: false,
    refetch: mock<ReturnType<typeof useGetMerklRewards>['refetch']>(),
    waitForMerklToResolveClaim:
        mock<ReturnType<typeof useGetMerklRewards>['waitForMerklToResolveClaim']>(),
};

const renderYieldTable = () => {
    const services: DesktopAnalyticsDep & { store: DispatchDep } = {
        analytics: mockDesktopAnalytics(mock<DesktopAnalyticsDep['analytics']['report']>()),
        store: { dispatch: mock<Dispatch>() },
    };
    const onReady = mock<(payload: YieldDashboardReadyPayload) => void>();

    render(
        <ServicesProvider services={services}>
            <EarnYieldTable onReady={onReady} />
        </ServicesProvider>,
    );

    return onReady;
};

jest.mock('@trezor/components', () => ({ Column: ({ children }: PropsWithChildren) => children }));
jest.mock('@suite/intl', () => ({ Translation: () => null }));
jest.mock('@suite/message-system', () => ({ ContextMessage: () => null }));
jest.mock('@suite/debug', () => ({ selectIsDebugModeActive: () => false }));
jest.mock('@suite/router', () => ({
    ...jest.requireActual('@suite/router'),
    useAnchor: () => ({ anchorRef: undefined }),
    selectRouterAnchor: () => undefined,
}));
jest.mock('src/components/dashboard', () => ({
    DashboardSection: ({ children }: PropsWithChildren) => children,
}));
jest.mock('src/hooks/suite', () => ({
    useSelector: (selector: (state: AppState) => unknown) => selector(mockInitialAppState),
}));
jest.mock('src/hooks/suite/useLayoutSize', () => ({
    useLayoutSize: () => ({ isBelowLaptop: true }),
}));
jest.mock('src/hooks/suite/useMessageSystemYield', () => ({
    useMessageSystemYield: () => ({ isDisabled: false }),
}));
jest.mock('@suite-common/earn-stablecoin-api', () => ({
    ...jest.requireActual('@suite-common/earn-stablecoin-api'),
    useAllYieldOpportunities: () => ({ data: [], isLoading: false, isError: false }),
    useGetMerklRewards: jest.fn(),
}));
jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    selectVisibleDeviceAccounts: () => [],
    selectBaseCurrency: () => 'usd',
    selectCurrentFiatRates: () => ({}),
    useMissingRateTickersQuery: () => ({ isLoading: false }),
}));
jest.mock('./hooks/useYieldTableData', () => ({
    useYieldTableData: () => ({
        yieldAccountOpportunities: [],
        yieldInactiveVaultOpportunities: [],
        yieldAccounts: mockYieldAccounts,
        isYieldActive: false,
        hasAnyRewardsData: false,
        availableVaultCount: 0,
    }),
}));
jest.mock('./hooks/useYieldAccountsVisibility', () => ({
    useYieldAccountsVisibility: () => ({
        displayedYieldAccountOpportunities: [],
        hasHiddenYieldAccountOpportunities: false,
        isExpanded: false,
    }),
}));
jest.mock('./EarnYieldTableBody', () => ({ EarnYieldTableBody: () => null }));
jest.mock('./EarnYieldClaimRewardsBanner', () => ({ EarnYieldClaimRewardsBanner: () => null }));
jest.mock('./EarnYieldClaimSelectAccountModal', () => ({
    EarnYieldClaimSelectAccountModal: () => null,
}));
jest.mock('../common/EarnDashboardTableHeader', () => ({ EarnDashboardTableHeader: () => null }));
jest.mock('../../providers/PoweredByBadge', () => ({ PoweredByBadge: () => null }));

describe('yield dashboard readiness without rewards queries', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.mocked(useGetMerklRewards).mockReturnValue(mockRewardsQueryState);
    });

    it.each(['no-account', 'btc-only', 'fresh-eth'] as const)(
        'reports a ready empty yield section for %s',
        kind => {
            mockYieldAccounts =
                kind === 'no-account'
                    ? []
                    : [
                          mockWalletAccount(
                              { symbol: asNetworkSymbol(kind === 'btc-only' ? 'btc' : 'eth') },
                              kind === 'fresh-eth' ? { misc: { nonce: '1' } } : undefined,
                          ),
                      ];
            const onReady = renderYieldTable();

            expect(useGetMerklRewards).toHaveBeenCalledWith([]);
            expect(onReady).toHaveBeenCalledWith({
                hasYieldPosition: false,
                hasClaimBanner: false,
                availableVaultCount: 0,
                hasShowMore: false,
            });
        },
    );

    it.each([
        { isLoading: true, isError: false },
        { isLoading: false, isError: true },
    ])('still waits for an enabled rewards query ($isLoading, $isError)', status => {
        mockYieldAccounts = [mockWalletAccount({ symbol: asNetworkSymbol('eth') })];
        jest.mocked(useGetMerklRewards).mockReturnValue({ ...mockRewardsQueryState, ...status });

        const onReady = renderYieldTable();

        expect(useGetMerklRewards).toHaveBeenCalledWith(
            expect.arrayContaining([expect.objectContaining({ chainId: 1 })]),
        );
        expect(onReady).not.toHaveBeenCalled();
    });
});
