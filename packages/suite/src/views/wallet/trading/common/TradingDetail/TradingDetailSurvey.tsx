import { MessageSystemButton } from '@suite/message-system';
import { selectLanguage } from '@suite/settings';
import {
    Feature,
    type TradingSurveyPayload,
    resolveMessageContent,
    selectFeatureConfig,
    validateTradingSurvey,
} from '@suite-common/message-system';
import { Card, Column, H2, Paragraph } from '@trezor/components';
import { ArrowSquareOutIcon } from '@trezor/icons';

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
            <Column gap={20} padding={8}>
                <Column gap={8}>
                    <H2 typographyStyle="headline-sm">{title}</H2>
                    <Paragraph typographyStyle="body-sm" color="contentSecondary">
                        {description}
                    </Paragraph>
                </Column>
                <MessageSystemButton
                    cta={survey.cta}
                    iconRight={ArrowSquareOutIcon}
                    intent="brand"
                    size="large"
                />
            </Column>
        </Card>
    );
};
