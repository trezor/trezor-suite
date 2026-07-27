import {
    EarnFlow,
    type EarnProvider,
    type EarnYieldContext,
} from '@suite-common/suite-types/src/staking';
import { type Account } from '@suite-common/wallet-types';
import { exhaustive } from '@trezor/type-utils';

import { StakingEarnProviderConsentModal } from './StakingEarnProviderConsentModal';
import { UpdateEarnProviderConsentModal } from './UpdateEarnProviderConsentModal';
import { YieldEarnProviderConsentModal } from './YieldEarnProviderConsentModal';

interface EarnProviderConsentModalProps {
    flow: EarnFlow;
    provider: EarnProvider;
    account: Account;
    yieldContext?: EarnYieldContext;
    onCancel: () => void;
}

export const EarnProviderConsentModal = ({
    flow,
    provider,
    account,
    yieldContext,
    onCancel,
}: EarnProviderConsentModalProps) => {
    switch (flow) {
        case EarnFlow.Stake:
            return (
                <StakingEarnProviderConsentModal
                    account={account}
                    onCancel={onCancel}
                    provider={provider}
                    yieldContext={yieldContext}
                />
            );
        case EarnFlow.Yield:
            return (
                <YieldEarnProviderConsentModal
                    account={account}
                    onCancel={onCancel}
                    provider={provider}
                    yieldContext={yieldContext}
                />
            );
        case EarnFlow.UpdateProvider:
            return (
                <UpdateEarnProviderConsentModal
                    account={account}
                    onCancel={onCancel}
                    provider={provider}
                    yieldContext={yieldContext}
                />
            );
        default:
            return exhaustive(flow);
    }
};
