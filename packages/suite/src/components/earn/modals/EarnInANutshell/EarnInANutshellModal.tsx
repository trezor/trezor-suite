import { EarnFlow, EarnProvider } from '@suite-common/suite-types/src/staking';
import { exhaustive } from '@trezor/type-utils';

import { StakingEarnInANutshellModal } from './StakingEarnInANutshellModal';
import { UpdateEarnInANutshellModal } from './UpdateEarnInANutshellModal';
import { YieldEarnInANutshellModal } from './YieldEarnInANutshellModal';

interface EarnInANutshellModalProps {
    flow: EarnFlow;
    provider: EarnProvider;
    onCancel: () => void;
}

export const EarnInANutshellModal = ({ flow, provider, onCancel }: EarnInANutshellModalProps) => {
    switch (flow) {
        case EarnFlow.Stake:
            return <StakingEarnInANutshellModal onCancel={onCancel} provider={provider} />;
        case EarnFlow.Yield:
            return <YieldEarnInANutshellModal onCancel={onCancel} provider={provider} />;
        case EarnFlow.UpdateProvider:
            return <UpdateEarnInANutshellModal onCancel={onCancel} provider={provider} />;
        default:
            return exhaustive(flow);
    }
};
