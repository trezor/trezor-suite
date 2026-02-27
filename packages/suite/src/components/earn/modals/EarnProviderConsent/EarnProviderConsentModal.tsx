import { EarnFlow, EarnProvider } from '@suite-common/suite-types/src/staking';
import { Account } from '@suite-common/wallet-types';
import { exhaustive } from '@trezor/type-utils';

import { StakingEarnProviderConsentModal } from './StakingEarnProviderConsentModal';
import { UpdateEarnProviderConsentModal } from './UpdateEarnProviderConsentModal';
import { YieldEarnProviderConsentModal } from './YieldEarnProviderConsentModal';

interface EarnProviderConsentModalProps {
    flow: EarnFlow;
    provider: EarnProvider;
    account: Account;
    yieldId?: string;
    tokenContractAddress?: string;
    onCancel: () => void;
}

export const EarnProviderConsentModal = ({
    flow,
    provider,
    account,
    yieldId,
    tokenContractAddress,
    onCancel,
}: EarnProviderConsentModalProps) => {
    switch (flow) {
        case EarnFlow.Stake:
            return (
                <StakingEarnProviderConsentModal
                    account={account}
                    onCancel={onCancel}
                    provider={provider}
                    yieldId={yieldId}
                    tokenContractAddress={tokenContractAddress}
                />
            );
        case EarnFlow.Yield:
            return (
                <YieldEarnProviderConsentModal
                    account={account}
                    onCancel={onCancel}
                    provider={provider}
                    yieldId={yieldId}
                    tokenContractAddress={tokenContractAddress}
                />
            );
        case EarnFlow.UpdateProvider:
            return (
                <UpdateEarnProviderConsentModal
                    account={account}
                    onCancel={onCancel}
                    provider={provider}
                    yieldId={yieldId}
                    tokenContractAddress={tokenContractAddress}
                />
            );
        default:
            return exhaustive(flow);
    }
};
