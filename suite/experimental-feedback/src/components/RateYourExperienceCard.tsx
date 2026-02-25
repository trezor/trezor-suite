import styled from 'styled-components';

import { Translation } from '@suite/intl';
import {
    Button,
    Card,
    Column,
    ElevationUp,
    IconButton,
    Paragraph,
    Row,
    SuiteThemeColors,
} from '@trezor/components';
// TODO fix this import
import { ExperimentalFeature } from '@trezor/suite/src/constants/suite/experimental';

const emojiIcon = '☺️';

const EmojiIconContainer = styled.div<{ theme: SuiteThemeColors }>`
    width: 32px;
    height: 32px;
    border-radius: 8px;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 22px;
    background: ${({ theme }) => theme.backgroundAlertBlueSubtleOnElevation1};
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
}: RateYourExperienceCardProps) => (
    <ElevationUp>
        <Card fillType="default">
            <Column gap={12}>
                <EmojiIconContainer>{emojiIcon}</EmojiIconContainer>
                <Column gap={4}>
                    <Paragraph typographyStyle="body-md-strong">
                        <Translation
                            id="TR_EXPERIMENTAL_FEEDBACK_CARD_HEADING"
                            values={{
                                feature,
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
    </ElevationUp>
);
