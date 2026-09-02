import { type ReactNode } from 'react';

import {
    feedbackRatingSelectedEvent,
    feedbackSentEvent,
    selectDesktopAnalyticsDep,
} from '@suite/analytics';
import { Translation, useTranslation } from '@suite/intl';
import { goto } from '@suite/router';
import { events } from '@suite-common/analytics';
import { useServices } from '@suite-common/dependency-injection';
import { type Rating, buildUserFeedbackData, sendFeedbackAction } from '@suite-common/feedback';
import { useDispatch } from '@suite-common/redux-utils';
import { Button, Card, Column, Divider, Icon, IconCircle, Row, Text } from '@trezor/components';
import { CheckCircleFilledIcon, CheckIcon } from '@trezor/icons';
import { FeedbackCard } from '@trezor/product-components';

import { useLayoutSize } from 'src/hooks/suite/useLayoutSize';

type YieldFlowCompleteProps = {
    type: 'deposit' | 'withdraw' | 'claim';
    heading: ReactNode;
    description: ReactNode;
    showFeedback?: boolean;
    vaultId?: string;
    children: ReactNode;
};

export const YieldFlowComplete = ({
    type,
    heading,
    description,
    showFeedback,
    vaultId,
    children,
}: YieldFlowCompleteProps) => {
    const dispatch = useDispatch();
    const { analytics } = useServices(selectDesktopAnalyticsDep);
    const { translationString } = useTranslation();
    const { isBelowMobile } = useLayoutSize();

    const handleBackToOverview = () => {
        analytics.report({
            type: events.yieldNavigateEvent.name,
            payload: {
                action: 'continue',
                from: `${type}-form`,
                to: 'earn-dashboard',
                vaultId,
            },
        });

        dispatch(goto({ routeName: 'suite-earn' }));
    };

    const handleRatingSelect = (rating: Rating) => {
        analytics.report({
            type: feedbackRatingSelectedEvent.name,
            payload: { rating, category: 'yield', context: type, provider: vaultId },
        });
    };

    const handleFeedbackSubmit = (rating: Rating, description: string) => {
        analytics.report({
            type: events.yieldInteractionEvent.name,
            payload: {
                element: 'feedback-submit',
                value: rating,
                vaultId,
            },
        });

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

        analytics.report({
            type: feedbackSentEvent.name,
            payload: { category: 'yield', context: type, provider: vaultId },
        });
    };

    return (
        <Column gap={16}>
            <IconCircle icon={CheckIcon} intent="brand" size={isBelowMobile ? 64 : 96} />

            <Column gap={4}>
                <Text typographyStyle="headline-md" data-testid="@yield/flow-complete/heading">
                    {heading}
                </Text>

                <Text intent="neutral" priority="secondary">
                    {description}
                </Text>
            </Column>

            <Card type="contrast" paddingType="none">
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
                            <Icon as={CheckCircleFilledIcon} intent="brand" />
                            <Text
                                data-testid="@yield/flow-complete/status"
                                typographyStyle="body-md"
                                intent="brand"
                            >
                                <Translation id="TR_EARN_YIELD_COMPLETED" />
                            </Text>
                        </Row>
                    </Row>
                    <Divider color="borderNeutral" margin={0} />
                    {children}
                </Column>
            </Card>

            <Button
                intent="neutral"
                priority="secondary"
                data-testid="@yield/flow-complete/back-to-overview-button"
                onClick={handleBackToOverview}
            >
                <Translation id="TR_EARN_YIELD_BACK_TO_OVERVIEW" />
            </Button>

            {showFeedback && (
                <FeedbackCard
                    heading={
                        <Translation
                            id="TR_FEATURE_FEEDBACK_CARD_HEADING"
                            values={{
                                feature: translationString('TR_EARN_DEFI_YIELD_TITLE'),
                            }}
                        />
                    }
                    description={<Translation id="TR_FEEDBACK_CARD_DESCRIPTION" />}
                    submitLabel={<Translation id="TR_FEEDBACK_CARD_SEND" />}
                    successHeading={<Translation id="TR_FEEDBACK_CARD_SUCCESS_TITLE" />}
                    successDescription={<Translation id="TR_FEEDBACK_CARD_SUCCESS_DESCRIPTION" />}
                    onSubmit={handleFeedbackSubmit}
                    onRatingSelect={handleRatingSelect}
                />
            )}
        </Column>
    );
};
