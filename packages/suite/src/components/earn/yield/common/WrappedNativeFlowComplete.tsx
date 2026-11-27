import { type ReactNode } from 'react';

import { injectDesktopAnalytics } from '@suite/analytics';
import { events } from '@suite-common/analytics';
import { type WrappedNativeFlowType } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { useServices } from '@trezor/dependency-injection';

import { EarnFlowComplete } from '#src/components/earn/common/EarnFlowComplete';
import { EarnFlowStatusCard } from '#src/components/earn/common/EarnFlowStatusCard';

import { useNavigateToAccountRoute } from './useNavigateToAccountRoute';

type WrappedNativeFlowCompleteProps = {
    account: Account;
    flow: WrappedNativeFlowType;
    heading: ReactNode;
    description: ReactNode;
    children: ReactNode;
};

export const WrappedNativeFlowComplete = ({
    account,
    flow,
    heading,
    description,
    children,
}: WrappedNativeFlowCompleteProps) => {
    const { analytics } = useServices(injectDesktopAnalytics);
    const navigateToOverview = useNavigateToAccountRoute(account, 'wallet-tokens');

    const handleBackToOverview = () => {
        analytics.report({
            type: events.yieldNavigateEvent.name,
            payload: {
                action: 'continue',
                from: flow === 'wrap' ? 'wrap-form' : 'unwrap-form',
                to: 'account-detail',
                networkSymbol: account.symbol,
            },
        });
        navigateToOverview();
    };

    return (
        <EarnFlowComplete heading={heading} description={description} onBack={handleBackToOverview}>
            <EarnFlowStatusCard>{children}</EarnFlowStatusCard>
        </EarnFlowComplete>
    );
};
