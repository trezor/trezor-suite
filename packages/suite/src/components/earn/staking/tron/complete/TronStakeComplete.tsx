import { type ReactNode } from 'react';

import { gotoThunk } from '@suite/router';
import { type TronFlow } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { EarnFlowComplete } from '#src/components/earn/common/EarnFlowComplete';
import { EarnFlowFeedbackCard } from '#src/components/earn/common/EarnFlowFeedbackCard';

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

    const handleBackToOverview = () =>
        dispatch(
            gotoThunk({
                routeName: 'wallet-staking',
                params: {
                    symbol: account.symbol,
                    accountIndex: account.index,
                    accountType: account.accountType,
                },
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
