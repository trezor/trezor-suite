import { useEffect } from 'react';

import { EarnAccountRef, EarnFlow, EarnProvider } from '@suite-common/suite-types/src/staking';
import { exhaustive } from '@trezor/type-utils';

import { StakingEarnInANutshellModal } from './StakingEarnInANutshellModal';
import { UpdateEarnInANutshellModal } from './UpdateEarnInANutshellModal';
import { YieldEarnInANutshellModal } from './YieldEarnInANutshellModal';
import { useEarnModalAccount } from '../common/useEarnModalAccount';

interface EarnInANutshellModalProps {
    flow: EarnFlow;
    provider: EarnProvider;
    onCancel: () => void;
    account?: EarnAccountRef;
    yieldId?: string;
    tokenContractAddress?: string;
}

export const EarnInANutshellModal = ({
    flow,
    provider,
    onCancel,
    account,
    yieldId,
    tokenContractAddress,
}: EarnInANutshellModalProps) => {
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
                <StakingEarnInANutshellModal
                    onCancel={onCancel}
                    provider={provider}
                    accountRef={account}
                    yieldId={yieldId}
                    tokenContractAddress={tokenContractAddress}
                />
            );
        case EarnFlow.Yield:
            return (
                <YieldEarnInANutshellModal
                    onCancel={onCancel}
                    provider={provider}
                    accountRef={account}
                    yieldId={yieldId}
                    tokenContractAddress={tokenContractAddress}
                />
            );
        case EarnFlow.UpdateProvider:
            return (
                <UpdateEarnInANutshellModal
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
