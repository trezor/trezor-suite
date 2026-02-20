import { EarnFlow } from '@suite-common/suite-types/src/staking';
import { Account } from '@suite-common/wallet-types';

import { StakingSupplyForm } from './StakingSupplyForm';
import { YieldSupplyForm } from './YieldSupplyForm';

type SupplyFormProps = {
    flow: EarnFlow;
    account?: Account;
};

export const SupplyForm = ({ flow, account }: SupplyFormProps) => {
    if (flow === EarnFlow.Yield) {
        if (!account) {
            return null;
        }

        return <YieldSupplyForm account={account} />;
    }

    return <StakingSupplyForm flow={flow} />;
};
