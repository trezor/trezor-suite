import { Translation } from '@suite/intl';
import { EarnAccountRef, EarnFlow, EarnProvider } from '@suite-common/suite-types/src/staking';
import { isStakingNetworkType } from '@suite-common/wallet-utils';
import { Divider } from '@trezor/components';

import { EarnInANutshellModalLayout } from './components/EarnInANutshellModalLayout';
import {
    EarnInANutshellProcess,
    EarnInANutshellProcesses,
} from './components/EarnInANutshellProcesses';
import { EarnInANutshellWithdrawalBadge } from './components/EarnInANutshellWithdrawalBadge';
import { EarnSupplyingInfo } from './components/EarnSupplyingInfo';
import { EarnWithdrawingInfo } from './components/EarnWithdrawingInfo';
import { StakingEarnInANutshellHighlights } from './components/StakingEarnInANutshellHighlights';
import { useEarnInANutshellActions } from './hooks/useEarnInANutshellActions';
import { useEarnInANutshellData } from './hooks/useEarnInANutshellData';

interface StakingEarnInANutshellModalProps {
    onCancel: () => void;
    provider: EarnProvider;
    accountRef?: EarnAccountRef;
    yieldId?: string;
    tokenContractAddress?: string;
}

export const StakingEarnInANutshellModal = ({
    onCancel,
    provider,
    accountRef,
    yieldId,
    tokenContractAddress,
}: StakingEarnInANutshellModalProps) => {
    const { handleContinue, onCancelClick } = useEarnInANutshellActions({
        flow: EarnFlow.Stake,
        provider,
        onCancel,
        accountRef,
        yieldId,
        tokenContractAddress,
    });

    const data = useEarnInANutshellData();

    if (!data || (data.account && !isStakingNetworkType(data.account.networkType))) {
        return null;
    }

    const { account: selectedAccount, displaySymbol, unstakingPeriod } = data;

    if (!selectedAccount || !displaySymbol) return null;
    if (!isStakingNetworkType(selectedAccount.networkType)) return null;

    const processes: EarnInANutshellProcess[] = [
        {
            heading: <Translation id="TR_EARN_STAKING_PROCESS" />,
            badge: <Translation id="TR_TX_FEE" />,
            content: <EarnSupplyingInfo flow={EarnFlow.Stake} />,
        },
        {
            heading: <Translation id="TR_EARN_UNSTAKING_PROCESS" />,
            badge: <EarnInANutshellWithdrawalBadge networkType={selectedAccount.networkType} />,
            content: <EarnWithdrawingInfo flow={EarnFlow.Stake} />,
        },
    ];

    return (
        <EarnInANutshellModalLayout
            heading={<Translation id="TR_EARN_STAKING_IN_A_NUTSHELL" />}
            onCancel={onCancelClick}
            onContinue={handleContinue}
        >
            <StakingEarnInANutshellHighlights
                networkType={selectedAccount.networkType}
                displaySymbol={displaySymbol}
                unstakingPeriod={unstakingPeriod}
            />
            <Divider margin={{ top: 24, bottom: 16 }} />
            <EarnInANutshellProcesses items={processes} />
        </EarnInANutshellModalLayout>
    );
};
