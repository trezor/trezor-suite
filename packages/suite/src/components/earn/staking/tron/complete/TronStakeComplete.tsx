import { type ReactNode } from 'react';

import { gotoThunk, selectSettingsBackRoute } from '@suite/router';
import { type TronFlow } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { EarnFlowComplete } from '#src/components/earn/common/EarnFlowComplete';
import { EarnFlowFeedbackCard } from '#src/components/earn/common/EarnFlowFeedbackCard';
import { getStakingAccountRouteParams } from '#src/constants/suite/staking';
import { useSelector } from '#src/hooks/suite/useSelector';

interface TronStakeCompleteProps {
    account: Account;
    flow: TronFlow;
    heading: ReactNode;
    description: ReactNode;
    children: ReactNode;
}

export const TronStakeComplete = ({
    account,
    flow,
    heading,
    description,
    children,
}: TronStakeCompleteProps) => {
    const { dispatch } = useServices(injectDispatch);
    const previousRoute = useSelector(selectSettingsBackRoute);

    const handleBackToOverview = () =>
        dispatch(
            gotoThunk({
                routeName:
                    previousRoute.name === 'wallet-staking'
                        ? 'wallet-staking'
                        : 'earn-staking-tron',
                params: getStakingAccountRouteParams(account),
            }),
        );

    return (
        <EarnFlowComplete
            heading={heading}
            description={description}
            onBack={handleBackToOverview}
            headingTestId="@staking/tron-complete/heading"
            descriptionTestId="@staking/tron-complete/description"
            backButtonTestId="@staking/tron-complete/back-to-overview-button"
            feedback={
                <EarnFlowFeedbackCard
                    featureTitleId="TR_EARN_STAKING"
                    analyticsCategory="staking"
                    context={`tron-${flow}`}
                    feature="staking"
                />
            }
        >
            {children}
        </EarnFlowComplete>
    );
};
