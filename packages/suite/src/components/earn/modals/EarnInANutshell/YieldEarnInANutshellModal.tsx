import { Translation } from '@suite/intl';
import {
    EarnFlow,
    EarnModalAction,
    EarnProvider,
    EarnYieldContext,
} from '@suite-common/suite-types/src/staking';
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
import { YieldEarnInANutshellHighlights } from './components/YieldEarnInANutshellHighlights';
import { useEarnInANutshell } from './hooks/useEarnInANutshell';

interface YieldEarnInANutshellModalProps {
    account: Account;
    onCancel: () => void;
    provider: EarnProvider;
    actionType?: EarnModalAction;
    yieldContext?: EarnYieldContext;
}

export const YieldEarnInANutshellModal = ({
    account,
    onCancel,
    provider,
    actionType,
    yieldContext,
}: YieldEarnInANutshellModalProps) => {
    const { handleAction, onCancelClick, unstakingPeriod } = useEarnInANutshell({
        flow: EarnFlow.Yield,
        provider,
        onCancel,
        account,
        actionType,
        yieldContext,
    });

    if (!isStakingNetworkType(account.networkType)) return null;

    const processes: EarnInANutshellProcess[] = [
        {
            heading: <Translation id="TR_EARN_SUPPLYING_PROCESS" />,
            badge: <Translation id="TR_TX_FEE" />,
            content: <EarnSupplyingInfo account={account} flow={EarnFlow.Yield} />,
        },
        {
            heading: <Translation id="TR_EARN_WITHDRAWING_PROCESS" />,
            badge: <EarnInANutshellWithdrawalBadge networkType={account.networkType} />,
            content: <EarnWithdrawingInfo account={account} flow={EarnFlow.Yield} />,
        },
    ];

    return (
        <EarnInANutshellModalLayout
            heading={<Translation id="TR_EARN_SUPPLYING_IN_A_NUTSHELL" />}
            onCancel={onCancelClick}
            actionType={actionType}
            onAction={handleAction}
        >
            <YieldEarnInANutshellHighlights
                networkType={account.networkType}
                networkSymbol={account.symbol}
                unstakingPeriod={unstakingPeriod}
            />
            <Divider margin={{ top: 24, bottom: 16 }} />
            <EarnInANutshellProcesses items={processes} />
        </EarnInANutshellModalLayout>
    );
};
