import { selectLanguage } from '@suite/settings';
import {
    Feature,
    type TradingSurveyPayload,
    resolveMessageContent,
    selectFeatureConfig,
    validateTradingSurvey,
} from '@suite-common/message-system';
import { Card, Column, Paragraph, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { MessageSystemButton } from 'src/components/suite/banners/MessageSystemButton';
import { useSelector } from 'src/hooks/suite';

const safeValidateTradingSurvey = (data: unknown): TradingSurveyPayload | null => {
    try {
        return validateTradingSurvey(data);
    } catch (error) {
        console.error('Invalid trading.survey payload', error);

        return null;
    }
};

export const TradingDetailSurvey = () => {
    const surveyRaw = useSelector(state => selectFeatureConfig(state, Feature.trading.survey));
    const language = useSelector(selectLanguage);

    const survey = surveyRaw?.payload ? safeValidateTradingSurvey(surveyRaw.payload) : null;

    if (!survey) {
        console.error('TradingDetailSurvey: survey is not available');

        return null;
    }

    const title = survey?.title && resolveMessageContent(survey.title, language);

    const description = survey?.description && resolveMessageContent(survey.description, language);

    return (
        <Card>
            <Column gap={spacings.lg}>
                <Column gap={spacings.xs}>
                    <Text typographyStyle="headline-sm">{title}</Text>
                    <Paragraph maxWidth={400}>{description}</Paragraph>
                </Column>
                <MessageSystemButton cta={survey.cta} iconRight="arrowSquareOut" />
            </Column>
        </Card>
    );
};
