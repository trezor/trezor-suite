import { type ComponentProps } from 'react';

import { fireEvent, render } from '@testing-library/react';

import { type DesktopAnalytics } from '@suite/analytics';
import { mockDesktopAnalytics } from '@suite/analytics/mocks';
import { EarnProvider } from '@suite-common/suite-types';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { mockYieldVault } from '@suite-common/wallet-core/mocks';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { mock } from '@trezor/dependency-injection';

import { YieldEarnInANutshellModal } from './YieldEarnInANutshellModal';
import { type EarnInANutshellModalLayout } from './components/EarnInANutshellModalLayout';
import { useEarnInANutshell } from './hooks/useEarnInANutshell';

const mockAnalytics = mockDesktopAnalytics(mock<DesktopAnalytics['report']>());
const mockHandleAction = mock<ReturnType<typeof useEarnInANutshell>['handleAction']>();
const mockOnCancelClick = mock<ReturnType<typeof useEarnInANutshell>['onCancelClick']>();

jest.mock('@trezor/dependency-injection', () => ({
    ...jest.requireActual('@trezor/dependency-injection'),
    useServices: () => ({ analytics: mockAnalytics }),
}));
jest.mock('@suite/intl', () => ({
    ...jest.requireActual('@suite/intl'),
    Translation: () => null,
}));
jest.mock('@trezor/components', () => ({
    ...jest.requireActual('@trezor/components'),
    Divider: () => null,
}));
jest.mock('@suite-common/earn-stablecoin-api', () => ({
    ...jest.requireActual('@suite-common/earn-stablecoin-api'),
    useYieldOpportunity: () => ({ data: mockYieldVault() }),
}));
jest.mock('./hooks/useEarnInANutshell');
jest.mock('./components/YieldEarnInANutshellHighlights', () => ({
    YieldEarnInANutshellHighlights: () => null,
}));
jest.mock('./components/EarnInANutshellProcesses', () => ({
    EarnInANutshellProcesses: () => null,
}));
jest.mock('./components/EarnInANutshellModalLayout', () => ({
    EarnInANutshellModalLayout: ({
        onAction,
        onCancel,
    }: ComponentProps<typeof EarnInANutshellModalLayout>) => (
        <>
            <button onClick={onAction}>Primary action</button>
            <button onClick={onCancel}>Dismiss</button>
        </>
    ),
}));

const renderYieldEducation = (
    actionType?: ComponentProps<typeof YieldEarnInANutshellModal>['actionType'],
) =>
    render(
        <YieldEarnInANutshellModal
            account={mockWalletAccount({ symbol: asNetworkSymbol('eth') })}
            provider={EarnProvider.Morpho}
            onCancel={jest.fn()}
            actionType={actionType}
        />,
    );

describe('YieldEarnInANutshellModal analytics', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.mocked(useEarnInANutshell).mockReturnValue({
            handleAction: mockHandleAction,
            onCancelClick: mockOnCancelClick,
            unstakingPeriod: 1,
            apy: null,
        });
    });

    it('does not report a legal-modal transition when acknowledging information only', () => {
        const view = renderYieldEducation('close');
        fireEvent.click(view.getByRole('button', { name: 'Primary action' }));
        expect(mockHandleAction).toHaveBeenCalledTimes(1);
        expect(mockAnalytics.report).not.toHaveBeenCalled();
    });

    it('does not report deposit funnel cancellation when dismissing information only', () => {
        const view = renderYieldEducation('close');
        fireEvent.click(view.getByRole('button', { name: 'Dismiss' }));
        expect(mockOnCancelClick).toHaveBeenCalledTimes(1);
        expect(mockAnalytics.report).not.toHaveBeenCalled();
    });

    it.each([undefined, 'continue'] as const)(
        'reports an actual onboarding continuation with actionType %s',
        actionType => {
            const view = renderYieldEducation(actionType);
            fireEvent.click(view.getByRole('button', { name: 'Primary action' }));
            expect(mockHandleAction).toHaveBeenCalledTimes(1);
            expect(mockAnalytics.report).toHaveBeenCalledWith({
                type: 'yield/navigate',
                payload: {
                    action: 'continue',
                    from: 'deposit-in-a-nutshell-modal',
                    to: 'deposit-legal-modal',
                    networkSymbol: 'eth',
                    vaultId: 'vault-id',
                },
            });
        },
    );

    it('keeps cancellation reporting for the actual onboarding flow', () => {
        const view = renderYieldEducation();
        fireEvent.click(view.getByRole('button', { name: 'Dismiss' }));
        expect(mockOnCancelClick).toHaveBeenCalledTimes(1);
        expect(mockAnalytics.report).toHaveBeenCalledWith({
            type: 'yield/navigate',
            payload: {
                action: 'cancel',
                from: 'deposit-in-a-nutshell-modal',
                to: 'deposit-in-a-nutshell-modal',
                networkSymbol: 'eth',
                vaultId: 'vault-id',
            },
        });
    });
});
