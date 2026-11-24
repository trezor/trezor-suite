import { type ComponentProps, type PropsWithChildren } from 'react';
import { Provider } from 'react-redux';

import { render } from '@testing-library/react';

import { type DesktopAnalyticsDep } from '@suite/analytics';
import { mockDesktopAnalytics } from '@suite/analytics/mocks';
import { type SuiteRouterHistoryDep } from '@suite/router';
import { mockSuiteRouterHistory } from '@suite/router/mocks';
import { EarnFlow, EarnProvider } from '@suite-common/suite-types/src/staking';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { getEarnOpportunityKey } from '@suite-common/wallet-core';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { ServicesProvider, mock } from '@trezor/dependency-injection';
import { type WithServices } from '@trezor/redux-utils';

import { EarnInANutshellModal } from './EarnInANutshellModal';
import { type MockSuiteState, mockInitialAppState } from '../../../../../mocks/mockInitialAppState';

jest.mock('./StakingEarnInANutshellModal', () => ({ StakingEarnInANutshellModal: () => null }));
jest.mock('./UpdateEarnInANutshellModal', () => ({ UpdateEarnInANutshellModal: () => null }));
jest.mock('./YieldEarnInANutshellModal', () => ({ YieldEarnInANutshellModal: () => null }));

type ActionType = ComponentProps<typeof EarnInANutshellModal>['actionType'];

const renderOnboarding = (isConfirmed: boolean, actionType?: ActionType) => {
    const account = mockWalletAccount({ symbol: asNetworkSymbol('eth') });
    const yieldContext = { id: 'test-vault', vaultAddress: '0xvault' };
    const opportunity = getEarnOpportunityKey({
        type: 'yield',
        vaultAddress: yieldContext.vaultAddress,
    });
    const report = mock<DesktopAnalyticsDep['analytics']['report']>();
    const onCancel = mock<() => void>();
    const navigate = mock<SuiteRouterHistoryDep['suiteRouterHistory']['navigate']>();
    const { services } = createTestCompositionRoot<
        WithServices<DesktopAnalyticsDep & SuiteRouterHistoryDep>,
        MockSuiteState
    >({
        preloadedState: {
            ...mockInitialAppState,
            wallet: {
                ...mockInitialAppState.wallet,
                earnOnboarding: isConfirmed ? { [account.key]: [opportunity] } : {},
            },
        },
        services: () => ({
            analytics: mockDesktopAnalytics(report),
            suiteRouterHistory: { ...mockSuiteRouterHistory(), navigate },
        }),
    });
    const props = {
        flow: EarnFlow.Yield,
        provider: EarnProvider.Morpho,
        account,
        analyticsStep: 'earn-dashboard',
        actionType,
        yieldContext,
        onCancel,
    } satisfies ComponentProps<typeof EarnInANutshellModal>;
    const wrapper = ({ children }: PropsWithChildren) => (
        <Provider store={services.store}>
            <ServicesProvider services={services}>{children}</ServicesProvider>
        </Provider>
    );
    const view = render(<EarnInANutshellModal {...props} />, { wrapper });

    return { ...view, navigate, props, report };
};

describe('EarnInANutshellModal skipped onboarding analytics', () => {
    it.each([undefined, 'continue', 'close'] as const)(
        'reports an automatic deposit transition only for a flow entry (%s)',
        actionType => {
            const { navigate, props, report, rerender } = renderOnboarding(true, actionType);
            const { onCancel } = props;

            if (actionType === 'close') {
                expect(report).not.toHaveBeenCalled();
                expect(navigate).not.toHaveBeenCalled();
                expect(onCancel).not.toHaveBeenCalled();
            } else {
                expect(report).toHaveBeenCalledTimes(1);
                expect(report).toHaveBeenCalledWith({
                    type: 'yield/navigate',
                    payload: {
                        action: 'continue',
                        from: 'deposit-in-a-nutshell-modal',
                        to: 'deposit-form',
                        networkSymbol: 'eth',
                        vaultId: 'test-vault',
                    },
                });
                expect(navigate).toHaveBeenCalledTimes(1);
                expect(onCancel).toHaveBeenCalledTimes(1);
            }

            rerender(<EarnInANutshellModal {...props} onCancel={() => onCancel()} />);
            const expectedTransitions = actionType === 'close' ? 0 : 1;
            expect(report).toHaveBeenCalledTimes(expectedTransitions);
            expect(navigate).toHaveBeenCalledTimes(expectedTransitions);
            expect(onCancel).toHaveBeenCalledTimes(expectedTransitions);
        },
    );

    it('does not report an automatic transition for an unconfirmed opportunity', () => {
        const { navigate, props, report } = renderOnboarding(false);

        expect(report).not.toHaveBeenCalled();
        expect(navigate).not.toHaveBeenCalled();
        expect(props.onCancel).not.toHaveBeenCalled();
    });
});
