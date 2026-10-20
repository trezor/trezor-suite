import { ExperimentId, type MessageSystemState } from '@suite-common/message-system';
import { getTranslation } from '@suite-native/intl';

import { TradingHistoryDetailAfterTradeExperiment } from './TradingHistoryDetailAfterTradeExperiment';
import { renderWithTradingHistoryProvider } from '../../test-utils/tradingHistoryTestUtils';

type MessageSystemConfig = NonNullable<MessageSystemState['config']>;

const SURVEY_MESSAGE_ID = 'trading-survey-message';

const createLocalization = (text: string) => ({
    en: text,
    es: text,
    cs: text,
    de: text,
    fr: text,
    pt: text,
});

const createConfig = (activeVariant: string): MessageSystemConfig => ({
    version: 1,
    timestamp: '2026-01-01T00:00:00+00:00',
    sequence: 1,
    actions: [
        {
            conditions: [],
            message: {
                id: SURVEY_MESSAGE_ID,
                priority: 1,
                dismissible: false,
                variant: 'info',
                category: 'feature',
                content: createLocalization('Survey'),
                feature: [
                    {
                        domain: 'trading.survey',
                        flag: true,
                        payload: {
                            title: createLocalization('Join a user interview'),
                            description: createLocalization('Help us improve trading.'),
                            cta: {
                                action: 'external-link',
                                link: 'https://example.com/interview',
                                label: createLocalization('Book a call'),
                            },
                        },
                    },
                ],
            },
        },
    ],
    experiments: [
        {
            conditions: [],
            experiment: {
                id: ExperimentId.tradingFeedbackForm,
                groups: ['A', 'B', 'C'].map(variant => ({
                    variant,
                    percentage: variant === activeVariant ? 100 : 0,
                })),
            },
        },
    ],
});

const renderAfterTradeExperiment = (activeVariant?: string) =>
    renderWithTradingHistoryProvider(<TradingHistoryDetailAfterTradeExperiment type="exchange" />, {
        overrides: {
            analytics: { instanceId: 'test-instance' },
            ...(activeVariant
                ? {
                      messageSystem: {
                          config: createConfig(activeVariant),
                          validMessages: {
                              banner: [],
                              context: [],
                              modal: [],
                              feature: [SURVEY_MESSAGE_ID],
                          },
                          validExperiments: [ExperimentId.tradingFeedbackForm],
                      },
                  }
                : {}),
        },
    });

describe('TradingHistoryDetailAfterTradeExperiment', () => {
    it('renders nothing when the experiment is not active', async () => {
        const { queryByText, queryByTestId } = await renderAfterTradeExperiment();

        expect(queryByText(getTranslation('feedbackForm.title'))).not.toBeOnTheScreen();
        expect(queryByTestId('@trading-history/detail/survey')).not.toBeOnTheScreen();
    });

    it('renders nothing for the variant A', async () => {
        const { queryByText, queryByTestId } = await renderAfterTradeExperiment('A');

        expect(queryByText(getTranslation('feedbackForm.title'))).not.toBeOnTheScreen();
        expect(queryByTestId('@trading-history/detail/survey')).not.toBeOnTheScreen();
    });

    it('renders only the feedback card for the variant B', async () => {
        const { getByText, queryByTestId } = await renderAfterTradeExperiment('B');

        expect(getByText(getTranslation('feedbackForm.title'))).toBeOnTheScreen();
        expect(queryByTestId('@trading-history/detail/survey')).not.toBeOnTheScreen();
    });

    it('renders only the survey banner for the variant C', async () => {
        const { getByTestId, queryByText } = await renderAfterTradeExperiment('C');

        expect(getByTestId('@trading-history/detail/survey')).toBeOnTheScreen();
        expect(queryByText(getTranslation('feedbackForm.title'))).not.toBeOnTheScreen();
    });
});
