import { type PropsWithChildren } from 'react';
import { Provider } from 'react-redux';

import { render } from '@testing-library/react';

import { type DesktopAnalyticsDep } from '@suite/analytics';
import { mockDesktopAnalytics } from '@suite/analytics/mocks';
import { useGetMerklRewards } from '@suite-common/earn-stablecoin-api';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { ServicesProvider, mock } from '@trezor/dependency-injection';
import { type WithServices } from '@trezor/redux-utils';

import { EarnYieldTable } from './EarnYieldTable';
import { type MockSuiteState, mockInitialAppState } from '../../../../../mocks/mockInitialAppState';
import { type YieldDashboardReadyPayload } from '../useReportEarnDashboardReadyEvent';

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

const renderYieldTable = (accounts: Account[]) => {
    const [account] = accounts;
    const { services } = createTestCompositionRoot<
        WithServices<DesktopAnalyticsDep>,
        MockSuiteState
    >({
        preloadedState: {
            ...mockInitialAppState,
            device: {
                ...mockInitialAppState.device,
                selectedDevice: account
                    ? mockSuiteDevice({ state: { staticSessionId: account.deviceState } })
                    : undefined,
            },
            wallet: { ...mockInitialAppState.wallet, accounts },
        },
        services: () => ({ analytics: mockDesktopAnalytics() }),
    });
    const onReady = mock<(payload: YieldDashboardReadyPayload) => void>();

    render(
        <Provider store={services.store}>
            <ServicesProvider services={services}>
                <EarnYieldTable onReady={onReady} />
            </ServicesProvider>
        </Provider>,
    );

    return onReady;
};

jest.mock('@trezor/components', () => ({ Column: ({ children }: PropsWithChildren) => children }));
jest.mock('@suite/intl', () => ({ Translation: () => null }));
jest.mock('@suite/message-system', () => ({ ContextMessage: () => null }));
jest.mock('@suite/router', () => ({
    ...jest.requireActual('@suite/router'),
    useAnchor: () => ({ anchorRef: undefined }),
}));
jest.mock('#src/components/dashboard/DashboardSection', () => ({
    DashboardSection: ({ children }: PropsWithChildren) => children,
}));
jest.mock('#src/hooks/suite/useLayoutSize', () => ({
    useLayoutSize: () => ({ isBelowLaptop: true }),
}));
jest.mock('#src/hooks/suite/useMessageSystemYield', () => ({
    useMessageSystemYield: () => ({ isDisabled: false }),
}));
jest.mock('@suite-common/earn-stablecoin-api', () => ({
    ...jest.requireActual('@suite-common/earn-stablecoin-api'),
    useAllYieldOpportunities: () => ({ data: [], isLoading: false, isError: false }),
    useGetMerklRewards: jest.fn(),
}));
jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    useMissingRateTickersQuery: () => ({ isLoading: false }),
}));
jest.mock('./hooks/useYieldTableData', () => ({
    useYieldTableData: () => ({
        yieldAccountOpportunities: [],
        yieldInactiveVaultOpportunities: [],
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

describe('yield dashboard rewards and readiness', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.mocked(useGetMerklRewards).mockReturnValue(mockRewardsQueryState);
    });

    it.each(['no-account', 'btc-only', 'fresh-eth'] as const)(
        'reports a ready empty yield section for %s',
        kind => {
            const accounts =
                kind === 'no-account'
                    ? []
                    : [
                          mockWalletAccount(
                              { symbol: asNetworkSymbol(kind === 'btc-only' ? 'btc' : 'eth') },
                              kind === 'fresh-eth' ? { misc: { nonce: '1' } } : undefined,
                          ),
                      ];
            const onReady = renderYieldTable(accounts);

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
        ['eth', 1],
        ['arb', 42161],
        ['base', 8453],
        ['op', 10],
    ] as const)('queries %s rewards when no vaults are offered', (symbol, chainId) => {
        const account = mockWalletAccount({ symbol: asNetworkSymbol(symbol), tokens: [] });
        renderYieldTable([account, mockWalletAccount({ symbol: asNetworkSymbol('pol') })]);

        expect(useGetMerklRewards).toHaveBeenCalledWith([{ chainId, address: account.descriptor }]);
    });

    it.each([
        { isLoading: true, isError: false },
        { isLoading: false, isError: true },
    ])('still waits for an enabled rewards query ($isLoading, $isError)', status => {
        const account = mockWalletAccount({ symbol: asNetworkSymbol('eth') });
        jest.mocked(useGetMerklRewards).mockReturnValue({ ...mockRewardsQueryState, ...status });

        const onReady = renderYieldTable([account]);

        expect(useGetMerklRewards).toHaveBeenCalledWith(
            expect.arrayContaining([expect.objectContaining({ chainId: 1 })]),
        );
        expect(onReady).not.toHaveBeenCalled();
    });
});
