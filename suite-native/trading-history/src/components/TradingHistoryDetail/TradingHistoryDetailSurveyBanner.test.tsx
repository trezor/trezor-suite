import { Linking } from 'react-native';

import { type MessageSystemState } from '@suite-common/message-system';
import { userEvent, waitFor } from '@suite-native/test-utils-store';

import { TradingHistoryDetailSurveyBanner } from './TradingHistoryDetailSurveyBanner';
import { renderWithTradingHistoryProvider } from '../../test-utils/tradingHistoryTestUtils';

type MessageSystemConfig = NonNullable<MessageSystemState['config']>;
type SurveyCta = {
    action: 'external-link' | 'internal-link';
    link: string;
    label: ReturnType<typeof createLocalization>;
};

const SURVEY_MESSAGE_ID = 'trading-survey-message';
const SURVEY_LINK = 'https://example.com/interview';

const createLocalization = (text: string) => ({
    en: text,
    es: `${text} (es)`,
    cs: `${text} (cs)`,
    de: `${text} (de)`,
    fr: `${text} (fr)`,
    pt: `${text} (pt)`,
});

const createSurveyConfig = (payload: Record<string, unknown>): MessageSystemConfig => ({
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
                feature: [{ domain: 'trading.survey', flag: true, payload }],
            },
        },
    ],
});

const createSurveyPayload = ({
    action = 'external-link',
    link = SURVEY_LINK,
    label = createLocalization('Book a call'),
}: Partial<SurveyCta> = {}) => ({
    title: createLocalization('Join a user interview'),
    description: createLocalization('Help us improve trading.'),
    cta: { action, link, label },
});

const renderSurveyBanner = (payload: Record<string, unknown>) =>
    renderWithTradingHistoryProvider(<TradingHistoryDetailSurveyBanner />, {
        overrides: {
            messageSystem: {
                config: createSurveyConfig(payload),
                validMessages: { banner: [], context: [], modal: [], feature: [SURVEY_MESSAGE_ID] },
            },
        },
    });

describe('TradingHistoryDetailSurveyBanner', () => {
    const mockCanOpenURL = jest.spyOn(Linking, 'canOpenURL');
    const mockOpenURL = jest.spyOn(Linking, 'openURL');

    beforeEach(() => {
        jest.clearAllMocks();
        mockCanOpenURL.mockResolvedValue(true);
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    it('renders the survey texts and opens the survey link', async () => {
        const { getByTestId, getByText } = await renderSurveyBanner(createSurveyPayload());

        expect(getByText('Join a user interview')).toBeOnTheScreen();
        expect(getByText('Help us improve trading.')).toBeOnTheScreen();
        expect(getByText('Book a call')).toBeOnTheScreen();

        await userEvent.press(getByTestId('@trading-history/detail/survey/button'));

        await waitFor(() => {
            expect(mockOpenURL).toHaveBeenCalledWith(SURVEY_LINK);
        });
    });

    it('does not render without the survey feature', async () => {
        const { queryByTestId } = await renderWithTradingHistoryProvider(
            <TradingHistoryDetailSurveyBanner />,
        );

        expect(queryByTestId('@trading-history/detail/survey')).not.toBeOnTheScreen();
    });

    it('does not render with an invalid survey payload', async () => {
        const { queryByTestId } = await renderSurveyBanner({ title: createLocalization('Title') });

        expect(queryByTestId('@trading-history/detail/survey')).not.toBeOnTheScreen();
    });

    it('does not render with an internal link, which is not supported on mobile', async () => {
        const { queryByTestId } = await renderSurveyBanner(
            createSurveyPayload({ action: 'internal-link', link: 'wallet-index' }),
        );

        expect(queryByTestId('@trading-history/detail/survey')).not.toBeOnTheScreen();
    });

    it('does not render with an empty CTA label', async () => {
        const { queryByTestId } = await renderSurveyBanner(
            createSurveyPayload({ label: { en: '', es: '', cs: '', de: '', fr: '', pt: '' } }),
        );

        expect(queryByTestId('@trading-history/detail/survey')).not.toBeOnTheScreen();
    });
});
