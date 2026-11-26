import { type ReactNode } from 'react';

import { injectDesktopAnalytics } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { gotoThunk } from '@suite/router';
import { events } from '@suite-common/analytics';
import { type Rating } from '@suite-common/feedback';
import { Card, Column, Divider, Icon, Row, Text } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { CheckCircleFilledIcon } from '@trezor/icons';
import { injectDispatch } from '@trezor/redux-utils';

import { EarnFlowComplete } from '#src/components/earn/common/EarnFlowComplete';
import { EarnFlowFeedbackCard } from '#src/components/earn/common/EarnFlowFeedbackCard';

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
    const { analytics, dispatch } = useServices(injectDesktopAnalytics, injectDispatch);

    const handleBackToOverview = () => dispatch(gotoThunk({ routeName: 'suite-earn' }));

    const handleFeedbackSubmit = (rating: Rating) => {
        analytics.report({
            type: events.yieldInteractionEvent.name,
            payload: {
                element: 'feedback-submit',
                value: rating,
                vaultId,
            },
        });
    };

    return (
        <EarnFlowComplete
            heading={heading}
            description={description}
            onBack={handleBackToOverview}
            headingTestId="@yield/flow-complete/heading"
            backButtonTestId="@yield/flow-complete/back-to-overview-button"
            feedback={
                showFeedback && (
                    <EarnFlowFeedbackCard
                        featureTitleId="TR_EARN_DEFI_YIELD"
                        analyticsCategory="yield"
                        context={type}
                        provider={vaultId}
                        feature="yield"
                        onSubmit={handleFeedbackSubmit}
                    />
                )
            }
        >
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
        </EarnFlowComplete>
    );
};
