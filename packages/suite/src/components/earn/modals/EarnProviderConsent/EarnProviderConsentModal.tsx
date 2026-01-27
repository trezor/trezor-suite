import { EarnFlow, EarnProvider } from '@suite-common/suite-types/src/staking';
import { exhaustive } from '@trezor/type-utils';

import { StakingEarnProviderConsentModal } from './StakingEarnProviderConsentModal';
import { UpdateEarnProviderConsentModal } from './UpdateEarnProviderConsentModal';
import { YieldEarnProviderConsentModal } from './YieldEarnProviderConsentModal';

interface EarnProviderConsentModalProps {
    flow: EarnFlow;
    provider: EarnProvider;
    onCancel: () => void;
}

export const EarnProviderConsentModal = ({
    flow,
    provider,
    onCancel,
}: EarnProviderConsentModalProps) => {
    switch (flow) {
        case EarnFlow.Stake:
            return <StakingEarnProviderConsentModal onCancel={onCancel} provider={provider} />;
        case EarnFlow.Yield:
            return <YieldEarnProviderConsentModal onCancel={onCancel} provider={provider} />;
        case EarnFlow.UpdateProvider:
            return <UpdateEarnProviderConsentModal onCancel={onCancel} provider={provider} />;
        default:
            return exhaustive(flow);
    }
};
