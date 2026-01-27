import { Translation } from '@suite/intl';
import { EarnFlow, EarnProvider } from '@suite-common/suite-types/src/staking';
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
}

export const StakingEarnInANutshellModal = ({
    onCancel,
    provider,
}: StakingEarnInANutshellModalProps) => {
    const { handleContinue, onCancelClick } = useEarnInANutshellActions({
        flow: EarnFlow.Stake,
        provider,
        onCancel,
    });

    const data = useEarnInANutshellData();

    if (!data || (data.account && !isStakingNetworkType(data.account.networkType))) {
        return null;
    }

    const { account, displaySymbol, unstakingPeriod } = data;

    if (!account || !displaySymbol) return null;
    if (!isStakingNetworkType(account.networkType)) return null;

    const processes: EarnInANutshellProcess[] = [
        {
            heading: <Translation id="TR_EARN_STAKING_PROCESS" />,
            badge: <Translation id="TR_TX_FEE" />,
            content: <EarnSupplyingInfo flow={EarnFlow.Stake} />,
        },
        {
            heading: <Translation id="TR_EARN_UNSTAKING_PROCESS" />,
            badge: <EarnInANutshellWithdrawalBadge networkType={account.networkType} />,
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
                networkType={account.networkType}
                displaySymbol={displaySymbol}
                unstakingPeriod={unstakingPeriod}
            />
            <Divider margin={{ top: 24, bottom: 16 }} />
            <EarnInANutshellProcesses items={processes} />
        </EarnInANutshellModalLayout>
    );
};
