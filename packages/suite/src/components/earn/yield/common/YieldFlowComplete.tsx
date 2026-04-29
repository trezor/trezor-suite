import { type ReactNode } from 'react';

import { Translation, useTranslation } from '@suite/intl';
import { goto } from '@suite/router';
import { type Rating, buildUserFeedbackData, sendFeedbackAction } from '@suite-common/feedback';
import { Button, Card, Column, Divider, Icon, IconCircle, Row, Text } from '@trezor/components';
import { FeedbackCard } from '@trezor/product-components';

import { useDispatch } from 'src/hooks/suite';

type YieldFlowCompleteProps = {
    heading: ReactNode;
    description: ReactNode;
    showFeedback?: boolean;
    children: ReactNode;
};

export const YieldFlowComplete = ({
    heading,
    description,
    showFeedback,
    children,
}: YieldFlowCompleteProps) => {
    const dispatch = useDispatch();
    const { translationString } = useTranslation();

    const handleBackToOverview = () => {
        dispatch(goto({ routeName: 'suite-earn' }));
    };

    const handleFeedbackSubmit = (rating: Rating, description: string) => {
        dispatch(
            sendFeedbackAction({
                type: 'SUGGESTION',
                payload: {
                    category: 'experimental',
                    feature: 'stablecoin-yield',
                    rating,
                    description,
                    ...buildUserFeedbackData(),
                },
            }),
        );
    };

    return (
        <Column gap={16}>
            <IconCircle name="check" intent="brand" size={96} />

            <Column gap={4}>
                <Text typographyStyle="headline-md">{heading}</Text>

                <Text intent="neutral" priority="secondary">
                    {description}
                </Text>
            </Column>

            <Card fillType="flat" paddingType="none">
                <Column gap={0}>
                    <Row
                        justifyContent="space-between"
                        alignItems="center"
                        padding={{ vertical: 16, horizontal: 20 }}
                    >
                        <Text typographyStyle="body-md">
                            <Translation id="TR_EARN_YIELD_STATUS" />
                        </Text>
                        <Row alignItems="center" gap={8}>
                            <Icon name="checkCircleFilled" intent="brand" />
                            <Text typographyStyle="body-md" intent="brand">
                                <Translation id="TR_EARN_YIELD_COMPLETED" />
                            </Text>
                        </Row>
                    </Row>
                    <Divider color="borderNeutral" margin={0} />
                    {children}
                </Column>
            </Card>

            <Button intent="neutral" priority="secondary" onClick={handleBackToOverview}>
                <Translation id="TR_EARN_YIELD_BACK_TO_OVERVIEW" />
            </Button>

            {showFeedback && (
                <FeedbackCard
                    heading={
                        <Translation
                            id="TR_FEATURE_FEEDBACK_CARD_HEADING"
                            values={{
                                feature: translationString('TR_EARN_STABLECOIN_YIELD_TITLE'),
                            }}
                        />
                    }
                    description={<Translation id="TR_FEEDBACK_CARD_DESCRIPTION" />}
                    submitLabel={<Translation id="TR_FEEDBACK_CARD_SEND" />}
                    successHeading={<Translation id="TR_FEEDBACK_CARD_SUCCESS_TITLE" />}
                    successDescription={<Translation id="TR_FEEDBACK_CARD_SUCCESS_DESCRIPTION" />}
                    onSubmit={handleFeedbackSubmit}
                />
            )}
        </Column>
    );
};
