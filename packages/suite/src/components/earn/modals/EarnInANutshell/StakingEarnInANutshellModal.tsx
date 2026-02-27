import { Translation } from '@suite/intl';
import { EarnFlow, EarnProvider } from '@suite-common/suite-types/src/staking';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { Account } from '@suite-common/wallet-types';
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
import { useEarnInANutshell } from './hooks/useEarnInANutshell';

interface StakingEarnInANutshellModalProps {
    account: Account;
    onCancel: () => void;
    provider: EarnProvider;
    yieldId?: string;
    tokenContractAddress?: string;
}

export const StakingEarnInANutshellModal = ({
    account,
    onCancel,
    provider,
    yieldId,
    tokenContractAddress,
}: StakingEarnInANutshellModalProps) => {
    const { handleContinue, onCancelClick, unstakingPeriod } = useEarnInANutshell({
        flow: EarnFlow.Stake,
        provider,
        onCancel,
        account,
        yieldId,
        tokenContractAddress,
    });

    if (!isStakingNetworkType(account.networkType)) {
        return null;
    }

    const displaySymbol = getNetworkDisplaySymbol(account.symbol);

    if (!displaySymbol) return null;

    const processes: EarnInANutshellProcess[] = [
        {
            heading: <Translation id="TR_EARN_STAKING_PROCESS" />,
            badge: <Translation id="TR_TX_FEE" />,
            content: <EarnSupplyingInfo account={account} flow={EarnFlow.Stake} />,
        },
        {
            heading: <Translation id="TR_EARN_UNSTAKING_PROCESS" />,
            badge: <EarnInANutshellWithdrawalBadge networkType={account.networkType} />,
            content: <EarnWithdrawingInfo account={account} flow={EarnFlow.Stake} />,
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
