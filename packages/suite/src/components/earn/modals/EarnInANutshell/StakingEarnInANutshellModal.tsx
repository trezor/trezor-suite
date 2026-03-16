import { Translation } from '@suite/intl';
import {
    EarnFlow,
    type EarnModalAction,
    type EarnProvider,
    type EarnYieldContext,
} from '@suite-common/suite-types/src/staking';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { isStakingNetworkType } from '@suite-common/wallet-utils';
import { Divider } from '@trezor/components';

import { EarnInANutshellModalLayout } from './components/EarnInANutshellModalLayout';
import {
    type EarnInANutshellProcess,
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
    actionType?: EarnModalAction;
    yieldContext?: EarnYieldContext;
}

export const StakingEarnInANutshellModal = ({
    account,
    onCancel,
    provider,
    actionType,
    yieldContext,
}: StakingEarnInANutshellModalProps) => {
    const { handleAction, onCancelClick, unstakingPeriod } = useEarnInANutshell({
        flow: EarnFlow.Stake,
        provider,
        onCancel,
        account,
        actionType,
        yieldContext,
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
            actionType={actionType}
            onAction={handleAction}
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
