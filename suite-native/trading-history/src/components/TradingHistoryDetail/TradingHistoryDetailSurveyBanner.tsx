import { useSelector } from 'react-redux';

import {
    Feature,
    type MessageSystemRootState,
    type TradingSurveyPayload,
    resolveMessageContent,
    selectFeatureConfig,
    validateTradingSurvey,
} from '@suite-common/message-system';
import { Button, Card, Text, VStack } from '@suite-native/atoms';
import { selectSupportedLanguageLocale } from '@suite-native/intl';
import { useOpenLink } from '@suite-native/link';

const safeValidateTradingSurvey = (data: unknown): TradingSurveyPayload | null => {
    try {
        return validateTradingSurvey(data);
    } catch (error) {
        console.error('Invalid trading.survey payload', error);

        return null;
    }
};

export const TradingHistoryDetailSurveyBanner = () => {
    const surveyFeature = useSelector((state: MessageSystemRootState) =>
        selectFeatureConfig(state, Feature.trading.survey),
    );
    const language = useSelector(selectSupportedLanguageLocale);
    const openLink = useOpenLink();

    const survey = surveyFeature?.payload ? safeValidateTradingSurvey(surveyFeature.payload) : null;

    // Internal links of the message system are not supported on mobile yet.
    if (survey?.cta.action !== 'external-link') {
        return null;
    }

    const { title, description, cta } = survey;

    const handleCtaPress = () => {
        openLink(cta.link);
    };

    const resolvedTitle = resolveMessageContent(title, language);
    const resolvedDescription = resolveMessageContent(description, language);
    const resolvedCtaLabel = resolveMessageContent(cta.label, language);

    return (
        <Card testID="@trading-history/detail/survey">
            <VStack spacing="sp16">
                <VStack spacing="sp4">
                    <Text variant="body-md-strong">{resolvedTitle}</Text>
                    <Text variant="body-sm" color="contentSecondary">
                        {resolvedDescription}
                    </Text>
                </VStack>
                <Button
                    intent="brand"
                    iconRight="arrowSquareOut"
                    onPress={handleCtaPress}
                    testID="@trading-history/detail/survey/button"
                >
                    {resolvedCtaLabel}
                </Button>
            </VStack>
        </Card>
    );
};
