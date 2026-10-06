import { sendFeedbackThunk } from '@suite-common/feedback';
import { type NativeAnalyticsDep, events } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { getTranslation } from '@suite-native/intl';
import { fireEvent, screen } from '@suite-native/test-utils-store';

import { TradingDetailFeedback } from './TradingDetailFeedback';
import { renderWithTradingHistoryProvider } from '../../test-utils/tradingHistoryTestUtils';

jest.mock('@suite-common/feedback', () => ({
    ...jest.requireActual('@suite-common/feedback'),
    sendFeedbackThunk: jest.fn(() => ({ type: 'mock/sendFeedbackAction' })),
}));

const sendFeedbackActionMock = sendFeedbackThunk as unknown as jest.Mock;

const reportMock = jest.fn();
const services: NativeAnalyticsDep = { analytics: mockNativeAnalytics(reportMock) };

describe('TradingDetailFeedback', () => {
    const renderTradingDetailFeedback = async (
        props: Partial<Parameters<typeof TradingDetailFeedback>[0]> = {},
    ) =>
        await renderWithTradingHistoryProvider(
            <TradingDetailFeedback type="exchange" {...props} />,
            {
                services,
                overrides: {
                    geolocation: { countryCode: 'CZ' },
                    analytics: { instanceId: 'test-instance' },
                },
            },
        );

    beforeEach(() => {
        sendFeedbackActionMock.mockClear();
        reportMock.mockClear();
    });

    it('renders the feedback card heading', async () => {
        await renderTradingDetailFeedback();

        expect(screen.getByText(getTranslation('feedbackForm.title'))).toBeOnTheScreen();
    });

    it('sends a trade feedback with the selected rating and typed description on submit', async () => {
        await renderTradingDetailFeedback({
            status: 'CONFIRMED',
            provider: 'changelly',
            id: 'order-1',
            sendCurrency: 'BTC',
            receiveCurrency: 'ETH',
            country: 'US',
        });

        await fireEvent.press(screen.getByTestId('@feedback-form/rating/4'));
        await fireEvent.changeText(
            screen.getByTestId('@feedback-form/description-input'),
            'Great!',
        );
        await fireEvent.press(screen.getByTestId('@feedback-form/submit-button'));

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

    it('does not send feedback until a rating and description are provided', async () => {
        await renderTradingDetailFeedback();

        await fireEvent.press(screen.getByTestId('@feedback-form/rating/4'));
        await fireEvent.press(screen.getByTestId('@feedback-form/submit-button'));

        expect(sendFeedbackActionMock).not.toHaveBeenCalled();
        expect(reportMock).not.toHaveBeenCalledWith(
            expect.objectContaining({ type: events.feedbackSentEvent.name }),
        );
    });

    it('reports the rating selected event with the rating, category, trade context and provider', async () => {
        await renderTradingDetailFeedback({ provider: 'changelly' });

        await fireEvent.press(screen.getByTestId('@feedback-form/rating/4'));

        expect(reportMock).toHaveBeenCalledWith({
            type: events.feedbackRatingSelectedEvent.name,
            payload: { rating: '4', category: 'trade', context: 'exchange', provider: 'changelly' },
        });
    });

    it('reports the feedback sent event on submit', async () => {
        await renderTradingDetailFeedback({ provider: 'changelly' });

        await fireEvent.press(screen.getByTestId('@feedback-form/rating/4'));
        await fireEvent.changeText(
            screen.getByTestId('@feedback-form/description-input'),
            'Great!',
        );
        await fireEvent.press(screen.getByTestId('@feedback-form/submit-button'));

        expect(reportMock).toHaveBeenCalledWith({
            type: events.feedbackSentEvent.name,
            payload: { category: 'trade', context: 'exchange', provider: 'changelly' },
        });
    });
});
