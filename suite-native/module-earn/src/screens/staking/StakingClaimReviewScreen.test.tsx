import { type PropsWithChildren, type ReactNode } from 'react';

import { asNetworkSymbol } from '@suite-common/wallet-config';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { type NativeAnalyticsDep } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { getTranslation } from '@suite-native/intl';
import { fireEvent, renderWithStoreProvider } from '@suite-native/test-utils-store';

import { StakingClaimReviewScreen } from './StakingClaimReviewScreen';
import {
    updateEarnSelectedFeeLevelThunk,
    useComposeEarnFees,
} from '../../hooks/earn/useComposeEarnFees';

const mockNavigate = jest.fn();
let mockAccount = mockWalletAccount({ symbol: asNetworkSymbol('eth') });
let mockSymbol: 'eth' | 'sol' = 'eth';
let mockCanClaim = true;

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({ navigate: mockNavigate, addListener: jest.fn() }),
    useRoute: () => ({ params: { accountKey: mockAccount.key, symbol: mockSymbol } }),
}));
jest.mock('@suite-native/navigation', () => ({
    ...jest.requireActual('@suite-native/navigation'),
    Screen: ({ children, footer }: PropsWithChildren<{ footer: ReactNode }>) => (
        <>
            {children}
            {footer}
        </>
    ),
    ScreenHeader: () => null,
}));
jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    selectCanClaimByAccountKey: () => mockCanClaim,
    selectClaimableAmountByAccountKey: () => '1',
}));
jest.mock('../../hooks/earn/useComposeEarnFees');
jest.mock('../../hooks/earn/useEarnDeviceStatus', () => ({ useEarnDeviceStatus: () => undefined }));
jest.mock('../../hooks/earn/useNavigateBackAnalytics', () => ({
    useNavigateBackAnalytics: () => jest.fn(),
}));
jest.mock('../../hooks/staking/useSolanaStakingLimit', () => ({
    useSolanaStakingLimit: () => ({ isLimitExceeded: false }),
}));
jest.mock('../../hooks/staking/useStakingPendingTransaction', () => ({
    useStakingPendingTransaction: () => ({ isPending: false, pendingModal: null }),
}));
jest.mock('../../components/earn/EarnAmountCard', () => ({ EarnAmountCard: () => null }));
jest.mock('../../components/staking/StakingPendingTransactionModal', () => ({
    StakingPendingTransactionModal: () => null,
}));
jest.mock('../../components/yield/YieldFeeSection', () => ({
    YieldFeeSection: () => null,
}));

const renderClaim = () => {
    const services: NativeAnalyticsDep = { analytics: mockNativeAnalytics(jest.fn()) };

    mockAccount = mockWalletAccount({
        symbol: asNetworkSymbol(mockSymbol),
        availableBalance: mockSymbol === 'eth' ? '100000000000000' : '10000',
    });

    return renderWithStoreProvider(<StakingClaimReviewScreen />, {
        services,
        preloadedState: {
            wallet: {
                accounts: [mockAccount],
            },
        },
    });
};

const createFeeState = (): ReturnType<typeof useComposeEarnFees> => ({
    formDraft: undefined,
    formDraftKey: 'claim-account',
    isFeeUnavailable: false,
    hasFeeEstimationError: false,
    retryFeeEstimation: jest.fn(),
    isComposingFeeLevels: false,
    isFeeReady: true,
    updateFeeLevelThunk: updateEarnSelectedFeeLevelThunk,
});

describe('StakingClaimReviewScreen fee readiness', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockSymbol = 'eth';
        mockCanClaim = true;
        jest.mocked(useComposeEarnFees).mockReturnValue(createFeeState());
    });

    it.each(['eth', 'sol'] as const)(
        'allows a %s claim below the staking reserve when the transaction fee is ready',
        async symbol => {
            mockSymbol = symbol;
            const view = await renderClaim();
            const button = view.getByText(
                getTranslation('earn.claimReviewScreen.reviewAndSignButton'),
            );

            expect(button).toBeEnabled();
            await fireEvent.press(button);
            expect(mockNavigate).toHaveBeenCalledWith('StakingTransactionDataReview', {
                stakeType: 'claim',
                accountKey: mockAccount.key,
            });
        },
    );

    it.each([
        { isFeeReady: false },
        { isFeeReady: false, isFeeUnavailable: true },
        { isFeeReady: false, hasFeeEstimationError: true },
    ])('blocks a claim until usable fee recovery: %j', async feeState => {
        jest.mocked(useComposeEarnFees).mockReturnValue({
            ...createFeeState(),
            ...feeState,
        });
        const view = await renderClaim();

        expect(
            view.getByText(getTranslation('earn.claimReviewScreen.reviewAndSignButton')),
        ).toBeDisabled();
    });

    it('blocks a claim that is not claimable yet', async () => {
        mockCanClaim = false;
        const view = await renderClaim();

        expect(
            view.getByText(getTranslation('earn.claimReviewScreen.reviewAndSignButton')),
        ).toBeDisabled();
    });
});
