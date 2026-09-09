import { type Store } from '@reduxjs/toolkit';

import { tradingExchangeActions } from '@suite-common/trading';
import { type AccountsRootState } from '@suite-common/wallet-core';
import { mockAccountKey } from '@suite-common/wallet-types/mocks';
import { events } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { getTranslation } from '@suite-native/intl';
import { renderWithStoreProvider, userEvent } from '@suite-native/test-utils-store';
import { mercuryoFixedWorstQuote } from '@suite-native/trading-fixtures';
import { type TradingRootState } from '@suite-native/trading-state';

import { ApprovalButton, type ApprovalButtonProps } from './ApprovalButton';
import { createTradingTestStore } from '../../../test-utils/tradingTestUtils';

type State = TradingRootState & AccountsRootState;

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({
        navigate: mockNavigate,
    }),
}));

const mockAnalyticsReport = jest.fn();
const ethAccountKey = mockAccountKey({ symbol: 'eth', descriptor: 'eth1normal' });

describe('ApprovalButton', () => {
    let store: Store<State>;

    const renderApprovalButton = async (props: Partial<ApprovalButtonProps>) =>
        await renderWithStoreProvider(<ApprovalButton flowType="approve" isReady {...props} />, {
            services: { analytics: mockNativeAnalytics(mockAnalyticsReport), store },
        });

    beforeEach(() => {
        jest.clearAllMocks();

        store = createTradingTestStore({
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

    it('should render continue button when isReady is true', async () => {
        const { getByText } = await renderApprovalButton({ isReady: true });

        const button = getByText(getTranslation('moduleTrading.tradingScreen.buttons.continue'));
        expect(button).toBeOnTheScreen();
        expect(button).toBeEnabled();
    });

    it('should render disabled button when isReady is false', async () => {
        const { getByText } = await renderApprovalButton({ isReady: false });

        const button = getByText(getTranslation('moduleTrading.tradingScreen.buttons.continue'));
        expect(button).toBeOnTheScreen();
        expect(button).toBeDisabled();
    });

    it('should navigate to TradingExchangeOutputsReview on press', async () => {
        const { getByText } = await renderApprovalButton({ isReady: true });

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
        const { getByText } = await renderApprovalButton({ isReady: true });

        await userEvent.press(
            getByText(getTranslation('moduleTrading.tradingScreen.buttons.continue')),
        );

        expect(mockAnalyticsReport).toHaveBeenCalledWith({
            type: events.tradingExchangeEvent.name,
            payload: expect.objectContaining({ step: 'approval-preview', action: 'continue' }),
        });
    });

    it('should navigate to TradingExchangeOutputsReview on press for flowType revoke', async () => {
        const { getByText } = await renderApprovalButton({ isReady: true, flowType: 'revoke' });

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
        const { getByText } = await renderApprovalButton({ isReady: true, flowType: 'revoke' });

        await userEvent.press(
            getByText(getTranslation('moduleTrading.tradingScreen.buttons.continue')),
        );

        expect(mockAnalyticsReport).toHaveBeenCalledWith({
            type: events.tradingExchangeEvent.name,
            payload: expect.objectContaining({ step: 'revoke-preview', action: 'continue' }),
        });
    });

    it('should render nothing when no selected quote is provided', async () => {
        store.dispatch(tradingExchangeActions.saveSelectedQuote(undefined));

        const { toJSON } = await renderApprovalButton({ isReady: true });

        expect(toJSON()).toBeNull();
    });
});
