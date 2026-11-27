import { type ReactNode } from 'react';

import { injectDesktopAnalytics } from '@suite/analytics';
import { gotoThunk } from '@suite/router';
import { events } from '@suite-common/analytics';
import { type Rating } from '@suite-common/feedback';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { EarnFlowComplete } from '#src/components/earn/common/EarnFlowComplete';
import { EarnFlowFeedbackCard } from '#src/components/earn/common/EarnFlowFeedbackCard';
import { EarnFlowStatusCard } from '#src/components/earn/common/EarnFlowStatusCard';

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
            <EarnFlowStatusCard statusTestId="@yield/flow-complete/status">
                {children}
            </EarnFlowStatusCard>
        </EarnFlowComplete>
    );
};
