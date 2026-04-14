import styled from 'styled-components';

import { type FeedbackFeatureName, translatedFeedbackFeatures } from '@suite/experimental';
import { Translation, useTranslation } from '@suite/intl';
import {
    Box,
    Button,
    Column,
    IconButton,
    Paragraph,
    Row,
    type SuiteThemeColors,
} from '@trezor/components';

const emojiIcon = '☺️';

const EmojiIconContainer = styled.div<{ theme: SuiteThemeColors }>`
    font-size: 22px;
    line-height: 32px;
    text-align: center;
`;

export type RateYourExperienceProps = {
    feature: FeedbackFeatureName;
    onRate: () => void;
    onSkip: () => void;
    showSkipButton?: boolean;
};

export const RateYourExperience = ({
    onRate,
    onSkip,
    feature,
    showSkipButton = true,
}: RateYourExperienceProps) => {
    const { translationString } = useTranslation();

    return (
        <Column gap={12}>
            <Box backgroundColor="elementFillNeutralSoft" width={32} height={32} borderRadius={8}>
                <EmojiIconContainer>{emojiIcon}</EmojiIconContainer>
            </Box>
            <Column gap={4}>
                <Paragraph typographyStyle="body-md-strong">
                    <Translation
                        id="TR_FEATURE_FEEDBACK_CARD_HEADING"
                        values={{
                            feature: translationString(translatedFeedbackFeatures[feature]),
                        }}
                    />
                </Paragraph>
                <Paragraph intent="neutral" typographyStyle="body-sm">
                    <Translation
                        id="TR_FEATURE_FEEDBACK_CARD_DESCRIPTION"
                        values={{
                            feature,
                        }}
                    />
                </Paragraph>
            </Column>

            <Row gap={8}>
                <Button
                    flex={showSkipButton ? '1' : undefined}
                    intent="brand"
                    type="button"
                    onClick={onRate}
                >
                    <Translation id="TR_FEATURE_FEEDBACK_CARD_RATE_BUTTON" />
                </Button>

                {showSkipButton && (
                    <IconButton
                        icon="x"
                        intent="neutral"
                        priority="secondary"
                        type="button"
                        onClick={onSkip}
                    />
                )}
            </Row>
        </Column>
    );
};
