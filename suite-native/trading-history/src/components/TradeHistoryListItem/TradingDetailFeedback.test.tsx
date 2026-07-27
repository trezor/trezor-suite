import { sendFeedbackAction } from '@suite-common/feedback';
import { fireEvent, screen } from '@suite-native/test-utils-store';

import { TradingDetailFeedback } from './TradingDetailFeedback';
import { renderWithTradingHistoryProvider } from '../../test-utils/tradingHistoryTestUtils';

jest.mock('@suite-common/feedback', () => ({
    ...jest.requireActual('@suite-common/feedback'),
    sendFeedbackAction: jest.fn(() => ({ type: 'mock/sendFeedbackAction' })),
}));

const sendFeedbackActionMock = sendFeedbackAction as unknown as jest.Mock;

describe('TradingDetailFeedback', () => {
    const renderTradingDetailFeedback = (
        props: Partial<Parameters<typeof TradingDetailFeedback>[0]> = {},
    ) =>
        renderWithTradingHistoryProvider(<TradingDetailFeedback type="exchange" {...props} />, {
            overrides: {
                geolocation: { countryCode: 'CZ' },
                analytics: { instanceId: 'test-instance' },
            },
        });

    beforeEach(() => {
        sendFeedbackActionMock.mockClear();
    });

    it('renders the feedback card heading', () => {
        renderTradingDetailFeedback();

        expect(screen.getByText('How was your trading experience?')).toBeOnTheScreen();
    });

    it('sends a trade feedback with the selected rating and typed description on submit', () => {
        renderTradingDetailFeedback({
            status: 'CONFIRMED',
            provider: 'changelly',
            id: 'order-1',
            sendCurrency: 'BTC',
            receiveCurrency: 'ETH',
            country: 'US',
        });

        fireEvent.press(screen.getByTestId('@feedback-form/rating/4'));
        fireEvent.changeText(screen.getByTestId('@feedback-form/description-input'), 'Great!');
        fireEvent.press(screen.getByTestId('@feedback-form/submit-button'));

        expect(sendFeedbackActionMock).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'SUGGESTION',
                payload: expect.objectContaining({
                    category: 'trade',
                    type: 'exchange',
                    rating: '4',
                    description: 'Great!',
                    status: 'CONFIRMED',
                    provider: 'changelly',
                    id: 'order-1',
                    sendCurrency: 'BTC',
                    receiveCurrency: 'ETH',
                    countryOfResidence: 'US',
                }),
            }),
        );
    });

    it('does not send feedback until a rating and description are provided', () => {
        renderTradingDetailFeedback();

        fireEvent.press(screen.getByTestId('@feedback-form/rating/4'));
        fireEvent.press(screen.getByTestId('@feedback-form/submit-button'));

        expect(sendFeedbackActionMock).not.toHaveBeenCalled();
    });
});
