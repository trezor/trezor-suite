import { type PropsWithChildren, type ReactNode } from 'react';

import { combineReducers } from '@reduxjs/toolkit';

import { stakingActions, stakingReducer } from '@suite-common/earn-staking';
import { mockStakingState } from '@suite-common/earn-staking/mocks';
import {
    type StakingOperation,
    type StakingProductDescriptor,
    stakingAmountSchema,
} from '@suite-common/earn-staking-common';
import {
    mockStakingPosition,
    mockStakingProductDescriptor,
} from '@suite-common/earn-staking-common/mocks';
import { messageSystemInitialState } from '@suite-common/message-system';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { type NativeAnalyticsDep } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { getTranslation } from '@suite-native/intl';
import {
    act,
    createLightStore,
    createStaticReducer,
    createStoreFromPreloadedState,
    fireEvent,
    renderWithStoreProvider,
} from '@suite-native/test-utils-store';

import { StakingClaimReviewScreen } from './StakingClaimReviewScreen';
import {
    updateEarnSelectedFeeLevelThunk,
    useComposeEarnFees,
} from '../../hooks/earn/useComposeEarnFees';

type ClaimSymbol = 'eth' | 'sol';

const mockNavigate = jest.fn();
let mockAccount = mockWalletAccount({ symbol: asNetworkSymbol('eth') });
let mockSymbol: ClaimSymbol = 'eth';

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
jest.mock('../../components/earn/EarnFeeSection', () => ({
    EarnFeeSection: () => null,
}));

const ethProduct = mockStakingProductDescriptor();
const solProduct = mockStakingProductDescriptor({
    networkSymbol: asNetworkSymbol('sol'),
    type: 'native',
    operations: ['stake', 'unstake', 'withdraw'],
    rewardsKind: 'expected',
});
const productBySymbol: Record<ClaimSymbol, StakingProductDescriptor> = {
    eth: ethProduct,
    sol: solProduct,
};
const zero = stakingAmountSchema.parse('0');
// One coin ready to withdraw.
const withdrawableBySymbol: Record<ClaimSymbol, string> = {
    eth: '1000000000000000000',
    sol: '1000000000',
};

const selectedDevice = mockSuiteDevice();

const renderClaim = (operations: StakingOperation[] = ['stake', 'unstake', 'withdraw']) => {
    const services: NativeAnalyticsDep = { analytics: mockNativeAnalytics(jest.fn()) };
    const product = productBySymbol[mockSymbol];

    mockAccount = mockWalletAccount({
        symbol: asNetworkSymbol(mockSymbol),
        availableBalance: mockSymbol === 'eth' ? '100000000000000' : '10000',
        deviceState: selectedDevice.state?.staticSessionId,
    });

    const baseState = createStoreFromPreloadedState().getState();
    const store = createLightStore({
        reducer: {
            discreetMode: createStaticReducer(baseState.discreetMode),
            locale: createStaticReducer(baseState.locale),
            device: createStaticReducer({ devices: [selectedDevice], selectedDevice }),
            messageSystem: createStaticReducer(messageSystemInitialState),
            earn: combineReducers({ staking: stakingReducer }),
            wallet: createStaticReducer({ ...baseState.wallet, accounts: [mockAccount] }),
        },
        preloadedState: {
            earn: {
                staking: mockStakingState({
                    platform: 'mobile',
                    descriptors: [ethProduct, solProduct],
                    positions: {
                        [mockAccount.key]: [
                            mockStakingPosition({
                                productId: product.id,
                                balances: {
                                    staked: zero,
                                    pending: zero,
                                    unstaking: zero,
                                    withdrawable: stakingAmountSchema.parse(
                                        withdrawableBySymbol[mockSymbol],
                                    ),
                                    rewards: zero,
                                },
                                unlocks: [],
                                targets: [],
                                operations,
                            }),
                        ],
                    },
                }),
            },
        },
    });

    const view = renderWithStoreProvider(<StakingClaimReviewScreen />, {
        services: { ...services, store },
    });

    return { store, view };
};

const createFeeState = (): ReturnType<typeof useComposeEarnFees> => ({
    formDraft: undefined,
    formDraftKey: 'claim-account',
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
        jest.mocked(useComposeEarnFees).mockReturnValue(createFeeState());
    });

    it.each(['eth', 'sol'] as const)(
        'allows a %s claim below the staking reserve when the transaction fee is ready',
        async symbol => {
            mockSymbol = symbol;
            const view = await renderClaim().view;
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

    it.each([{ isFeeReady: false }, { isFeeReady: false, hasFeeEstimationError: true }])(
        'blocks a claim until usable fee recovery: %j',
        async feeState => {
            jest.mocked(useComposeEarnFees).mockReturnValue({
                ...createFeeState(),
                ...feeState,
            });
            const view = await renderClaim().view;

            expect(
                view.getByText(getTranslation('earn.claimReviewScreen.reviewAndSignButton')),
            ).toBeDisabled();
        },
    );

    it('blocks a claim while the position does not offer the withdrawal', async () => {
        const view = await renderClaim(['stake', 'unstake']).view;

        expect(
            view.getByText(getTranslation('earn.claimReviewScreen.reviewAndSignButton')),
        ).toBeDisabled();
    });

    it('explains why a Solana claim cannot continue after the balance is refreshed to zero', async () => {
        mockSymbol = 'sol';
        const { store, view: rendered } = renderClaim();
        const view = await rendered;
        expect(
            view.getByText(getTranslation('earn.claimReviewScreen.reviewAndSignButton')),
        ).toBeEnabled();

        await act(() => {
            store.dispatch(
                stakingActions.positionsSynced({ accountKey: mockAccount.key, positions: [] }),
            );
        });

        expect(
            view.getByText(
                getTranslation(
                    'transactionManagement.precomposedTransaction.errors.solanaStakingNothingToClaim',
                ),
            ),
        ).toBeVisible();
        expect(
            view.getByText(getTranslation('earn.claimReviewScreen.reviewAndSignButton')),
        ).toBeDisabled();
    });
});
