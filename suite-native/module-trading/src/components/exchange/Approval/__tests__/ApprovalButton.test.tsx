import { tradingExchangeActions } from '@suite-common/trading';
import { mockAccountKey } from '@suite-common/wallet-types/mocks';
import { getTranslation } from '@suite-native/intl';
import { type TestStore, renderWithStoreProvider, userEvent } from '@suite-native/test-utils-store';
import { mercuryoFixedWorstQuote } from '@suite-native/trading-fixtures';

import { createTradingLightStore } from '../../../../__tests__/tradingTestUtils';
import { ApprovalButton, type ApprovalButtonProps } from '../ApprovalButton';

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({
        navigate: mockNavigate,
    }),
}));

const mockAnalyticsReport = jest.fn();
jest.mock('@suite-native/trading-analytics', () => ({
    ...jest.requireActual('@suite-native/trading-analytics'),
    useExchangeAnalyticsStepReport:
        (action: unknown) =>
        (...args: unknown[]) =>
            mockAnalyticsReport(action, ...args),
}));

const ethAccountKey = mockAccountKey({ symbol: 'eth', descriptor: 'eth1normal' });

describe('ApprovalButton', () => {
    let store: TestStore;

    const renderApprovalButton = (props: Partial<ApprovalButtonProps>) =>
        renderWithStoreProvider(<ApprovalButton flowType="approve" isReady {...props} />, {
            store,
        });

    beforeEach(() => {
        jest.clearAllMocks();

        store = createTradingLightStore({
            tradeType: 'exchange',
            overrides: {
                wallet: {
                    trading: {
                        exchange: {
                            selectedQuote: mercuryoFixedWorstQuote,
                            tradingAccountKey: ethAccountKey,
                        },
                    },
                },
            },
        });
    });

    it('should render continue button when isReady is true', () => {
        const { getByText } = renderApprovalButton({ isReady: true });

        const button = getByText(getTranslation('moduleTrading.tradingScreen.buttons.continue'));
        expect(button).toBeOnTheScreen();
        expect(button).toBeEnabled();
    });

    it('should render disabled button when isReady is false', () => {
        const { getByText } = renderApprovalButton({ isReady: false });

        const button = getByText(getTranslation('moduleTrading.tradingScreen.buttons.continue'));
        expect(button).toBeOnTheScreen();
        expect(button).toBeDisabled();
    });

    it('should navigate to TradingExchangeOutputsReview on press', async () => {
        const { getByText } = renderApprovalButton({ isReady: true });

        await userEvent.press(
            getByText(getTranslation('moduleTrading.tradingScreen.buttons.continue')),
        );

        expect(mockNavigate).toHaveBeenCalledWith('TradingExchangeOutputsReview', {
            accountKey: ethAccountKey,
            tokenContract: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            orderId: 'c2de24a5-b923-42af-b70e-44bda8fa41dd',
            flowType: 'approve',
        });
    });

    it('should report to analytics on press', async () => {
        const { getByText } = renderApprovalButton({ isReady: true });

        await userEvent.press(
            getByText(getTranslation('moduleTrading.tradingScreen.buttons.continue')),
        );

        expect(mockAnalyticsReport).toHaveBeenCalledWith('approval-preview', 'continue');
    });

    it('should navigate to TradingExchangeOutputsReview on press for flowType revoke', async () => {
        const { getByText } = renderApprovalButton({ isReady: true, flowType: 'revoke' });

        await userEvent.press(
            getByText(getTranslation('moduleTrading.tradingScreen.buttons.continue')),
        );

        expect(mockNavigate).toHaveBeenCalledWith('TradingExchangeOutputsReview', {
            accountKey: ethAccountKey,
            tokenContract: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            orderId: 'c2de24a5-b923-42af-b70e-44bda8fa41dd',
            flowType: 'revoke',
        });
    });

    it('should report to analytics on press for flowType revoke', async () => {
        const { getByText } = renderApprovalButton({ isReady: true, flowType: 'revoke' });

        await userEvent.press(
            getByText(getTranslation('moduleTrading.tradingScreen.buttons.continue')),
        );

        expect(mockAnalyticsReport).toHaveBeenCalledWith('revoke-preview', 'continue');
    });

    it('should render nothing when no selected quote is provided', () => {
        store.dispatch(tradingExchangeActions.saveSelectedQuote(undefined));

        const { toJSON } = renderApprovalButton({ isReady: true });

        expect(toJSON()).toBeNull();
    });
});
