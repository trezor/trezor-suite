import { Translation } from '@suite/intl';
import { type Account } from '@suite-common/wallet-types';

import { EarnAccountPageHeader } from '#src/components/earn/common/EarnAccountPageHeader';

import { useYieldBackNavigation } from '../hooks/useYieldBackNavigation';

type YieldClaimPageHeaderProps = {
    account?: Account;
};

export const YieldClaimPageHeader = ({ account }: YieldClaimPageHeaderProps) => {
    const onBackClick = useYieldBackNavigation({ flowType: 'claim', account });

    return (
        <EarnAccountPageHeader
            title={<Translation id="TR_EARN_YIELD_CLAIM_REWARDS_HEADER" />}
            account={account}
            balanceFormat="compact"
            onBack={onBackClick}
            expandable
        />
    );
};
