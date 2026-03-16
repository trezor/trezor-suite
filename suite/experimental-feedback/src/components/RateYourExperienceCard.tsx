import styled from 'styled-components';

import { type ExperimentalFeature, translatedExperimentalFeatures } from '@suite/experimental';
import { Translation, useTranslation } from '@suite/intl';
import {
    Box,
    Button,
    Card,
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

type RateYourExperienceCardProps = {
    feature: ExperimentalFeature;
    onRate: () => void;
    onSkip: () => void;
};

export const RateYourExperienceCard = ({
    onRate,
    onSkip,
    feature,
}: RateYourExperienceCardProps) => {
    const { translationString } = useTranslation();

    return (
        <Card fillType="default">
            <Column gap={12}>
                <Box
                    backgroundColor="baseFillElementNeutralSoft"
                    width={32}
                    height={32}
                    borderRadius={8}
                >
                    <EmojiIconContainer>{emojiIcon}</EmojiIconContainer>
                </Box>
                <Column gap={4}>
                    <Paragraph typographyStyle="body-md-strong">
                        <Translation
                            id="TR_EXPERIMENTAL_FEEDBACK_CARD_HEADING"
                            values={{
                                feature: translationString(translatedExperimentalFeatures[feature]),
                            }}
                        />
                    </Paragraph>
                    <Paragraph intent="neutral" typographyStyle="body-sm">
                        <Translation
                            id="TR_EXPERIMENTAL_FEEDBACK_CARD_DESCRIPTION"
                            values={{
                                feature,
                            }}
                        />
                    </Paragraph>
                </Column>

                <Row gap={8}>
                    <Button flex="1" intent="brand" type="button" onClick={onRate}>
                        <Translation id="TR_EXPERIMENTAL_FEEDBACK_CARD_RATE_BUTTON" />
                    </Button>

                    <IconButton
                        icon="x"
                        intent="neutral"
                        priority="secondary"
                        type="button"
                        onClick={onSkip}
                    />
                </Row>
            </Column>
        </Card>
    );
};
