import { useEffect } from 'react';

import { EarnAccountRef, EarnFlow, EarnProvider } from '@suite-common/suite-types/src/staking';
import { exhaustive } from '@trezor/type-utils';

import { StakingEarnProviderConsentModal } from './StakingEarnProviderConsentModal';
import { UpdateEarnProviderConsentModal } from './UpdateEarnProviderConsentModal';
import { YieldEarnProviderConsentModal } from './YieldEarnProviderConsentModal';
import { useEarnModalAccount } from '../common/useEarnModalAccount';

interface EarnProviderConsentModalProps {
    flow: EarnFlow;
    provider: EarnProvider;
    onCancel: () => void;
    account?: EarnAccountRef;
    yieldId?: string;
    tokenContractAddress?: string;
}

export const EarnProviderConsentModal = ({
    flow,
    provider,
    onCancel,
    account,
    yieldId,
    tokenContractAddress,
}: EarnProviderConsentModalProps) => {
    const selectedAccount = useEarnModalAccount({ account, shouldSyncSelectedAccount: true });

    useEffect(() => {
        if (!selectedAccount) {
            onCancel();
        }
    }, [selectedAccount, onCancel]);

    if (!selectedAccount) {
        return null;
    }

    switch (flow) {
        case EarnFlow.Stake:
            return (
                <StakingEarnProviderConsentModal
                    onCancel={onCancel}
                    provider={provider}
                    accountRef={account}
                    yieldId={yieldId}
                    tokenContractAddress={tokenContractAddress}
                />
            );
        case EarnFlow.Yield:
            return (
                <YieldEarnProviderConsentModal
                    onCancel={onCancel}
                    provider={provider}
                    accountRef={account}
                    yieldId={yieldId}
                    tokenContractAddress={tokenContractAddress}
                />
            );
        case EarnFlow.UpdateProvider:
            return (
                <UpdateEarnProviderConsentModal
                    onCancel={onCancel}
                    provider={provider}
                    accountRef={account}
                    yieldId={yieldId}
                    tokenContractAddress={tokenContractAddress}
                />
            );
        default:
            return exhaustive(flow);
    }
};
