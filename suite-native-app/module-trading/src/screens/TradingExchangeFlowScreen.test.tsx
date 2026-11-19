import { type Store } from '@reduxjs/toolkit';

import { selectTradingExchangeSelectedQuote, tradingExchangeActions } from '@suite-common/trading';
import { type ExchangeFlowApprovalStatus, type ExchangeFlowStep } from '@suite-native/navigation';
import { act, screen } from '@suite-native/test-utils-store';
import { mercuryoFixedWorstQuote } from '@suite-native/trading-fixtures';
import { type TradingRootState } from '@suite-native/trading-state';

import { TradingExchangeFlowScreen } from './TradingExchangeFlowScreen';
import { type TradingExchangeApprovalStepProps } from '../components/exchange/Flow/TradingExchangeApprovalStep';
import { type TradingExchangePreviewStepProps } from '../components/exchange/Flow/TradingExchangePreviewStep';
import { type TradingExchangeRevokeStepProps } from '../components/exchange/Flow/TradingExchangeRevokeStep';
import { createTradingTestStore, renderWithTradingProvider } from '../test-utils/tradingTestUtils';

let mockOnApprovalRequired: (() => void) | undefined;

jest.mock('../components/exchange/Flow/TradingExchangeRevokeStep', () => {
    const { Text } = jest.requireActual('@suite-native/atoms');

    return {
        TradingExchangeRevokeStep: ({ approvalStatus }: TradingExchangeRevokeStepProps) => (
            <Text>{`Revoke step ${approvalStatus}`}</Text>
        ),
    };
});

jest.mock('../components/exchange/Flow/TradingExchangeApprovalStep', () => {
    const { Text } = jest.requireActual('@suite-native/atoms');

    return {
        TradingExchangeApprovalStep: ({ approvalStatus }: TradingExchangeApprovalStepProps) => (
            <Text>{`Approval step ${approvalStatus}`}</Text>
        ),
    };
});

jest.mock('../components/exchange/Flow/TradingExchangePreviewStep', () => {
    const { Text } = jest.requireActual('@suite-native/atoms');

    return {
        TradingExchangePreviewStep: ({
            approvalStatus,
            onApprovalRequired,
        }: TradingExchangePreviewStepProps) => {
            mockOnApprovalRequired = onApprovalRequired;

            return <Text>{`Preview step ${approvalStatus}`}</Text>;
        },
    };
});

describe('TradingExchangeFlowScreen', () => {
    let store: Store<TradingRootState>;
    const setParams = jest.fn();

    const renderScreen = (
        approvalStatus: ExchangeFlowApprovalStatus,
        currentStep?: ExchangeFlowStep,
    ) =>
        renderWithTradingProvider(
            <TradingExchangeFlowScreen
                route={{ params: { approvalStatus, currentStep } } as any}
                navigation={{ setParams } as any}
            />,
            { services: { store }, tradeType: 'exchange' },
        );

    beforeEach(() => {
        jest.clearAllMocks();
        mockOnApprovalRequired = undefined;

        store = createTradingTestStore({ tradeType: 'exchange' });
        store.dispatch(tradingExchangeActions.saveSelectedQuote(mercuryoFixedWorstQuote));
    });

    it.each<[ExchangeFlowApprovalStatus, ExchangeFlowStep | undefined, string]>([
        ['needs_revoke', undefined, 'Revoke step needs_revoke'],
        ['needs_revoke', 'approval', 'Approval step needs_revoke'],
        ['needs_revoke', 'preview', 'Preview step needs_revoke'],
        ['needs_increase', undefined, 'Approval step needs_increase'],
        ['needs_approval', 'preview', 'Preview step needs_approval'],
        ['needs_approval', 'revoke', 'Approval step needs_approval'],
    ])(
        'renders the right step for %s with the %s current step',
        async (approvalStatus, currentStep, expectedText) => {
            await renderScreen(approvalStatus, currentStep);

            expect(screen.getByText(expectedText)).toBeOnTheScreen();
        },
    );

    it('moves back to the approval step when the preview requires an approval', async () => {
        await renderScreen('needs_approval', 'preview');

        await act(() => mockOnApprovalRequired?.());

        expect(setParams).toHaveBeenCalledWith({ currentStep: 'approval' });
    });

    it('clears the trading state when leaving the flow', async () => {
        const { unmount } = await renderScreen('needs_approval');

        expect(selectTradingExchangeSelectedQuote(store.getState())).toBeDefined();

        await unmount();

        expect(selectTradingExchangeSelectedQuote(store.getState())).toBeUndefined();
    });
});
