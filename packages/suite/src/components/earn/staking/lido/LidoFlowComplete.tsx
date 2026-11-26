import { type ReactNode } from 'react';

import { type TranslationKey } from '@suite/intl';
import { type LidoTransactionKind } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';

import { useNavigateToLidoRoute } from './useNavigateToLidoRoute';
import { EarnFlowComplete } from '../../common/EarnFlowComplete';
import { EarnFlowFeedbackCard } from '../../common/EarnFlowFeedbackCard';
import { EarnFlowStatusCard } from '../../common/EarnFlowStatusCard';

type LidoFlowCompleteProps = {
    account: Account;
    kind: Exclude<LidoTransactionKind, 'approve'>;
    heading: ReactNode;
    description: ReactNode;
    statusLabelId?: TranslationKey;
    children?: ReactNode;
};

export const LidoFlowComplete = ({
    account,
    kind,
    heading,
    description,
    statusLabelId,
    children,
}: LidoFlowCompleteProps) => {
    const navigateToLidoRoute = useNavigateToLidoRoute(account);

    return (
        <EarnFlowComplete
            heading={heading}
            description={description}
            data-testid="@staking/lido/complete"
            headingTestId="@yield/flow-complete/heading"
            backButtonTestId="@yield/flow-complete/back-to-overview-button"
            onBack={() => navigateToLidoRoute('earn-lido')}
            feedback={
                <EarnFlowFeedbackCard
                    featureTitleId="TR_EARN_LIDO_PAGE_TITLE"
                    analyticsCategory="staking"
                    context={`lido-${kind}`}
                    provider="lido"
                    feature="staking"
                />
            }
        >
            <EarnFlowStatusCard
                statusLabelId={statusLabelId}
                statusTestId="@yield/flow-complete/status"
            >
                {children}
            </EarnFlowStatusCard>
        </EarnFlowComplete>
    );
};
