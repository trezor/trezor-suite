import { EarnFlow } from '@suite-common/suite-types/src/staking';
import { Account } from '@suite-common/wallet-types';
import { exhaustive } from '@trezor/type-utils';

import { StakingEarnSupplyModal } from './StakingEarnSupplyModal';
import { YieldEarnSupplyModal } from './YieldEarnSupplyModal';

type EarnSupplyModalProps = {
    onCancel?: () => void;
    flow: EarnFlow;
    account: Account;
    yieldId?: string;
    tokenContractAddress?: string;
};

export const EarnSupplyModal = ({
    onCancel,
    flow,
    account,
    // TODO: Use `yieldId` to preselect a specific Yield opportunity in Supply flow.
    yieldId: _yieldId,
    tokenContractAddress,
}: EarnSupplyModalProps) => {
    switch (flow) {
        case EarnFlow.Yield:
            return (
                <YieldEarnSupplyModal
                    onCancel={onCancel}
                    account={account}
                    tokenContractAddress={tokenContractAddress}
                />
            );
        case EarnFlow.Stake:
        case EarnFlow.UpdateProvider:
            return <StakingEarnSupplyModal onCancel={onCancel} account={account} flow={flow} />;
        default:
            return exhaustive(flow);
    }
};
