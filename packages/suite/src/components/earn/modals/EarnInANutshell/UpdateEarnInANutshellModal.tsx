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
import { UpdateEarnInANutshellHighlights } from './components/UpdateEarnInANutshellHighlights';
import { useEarnInANutshell } from './hooks/useEarnInANutshell';

interface UpdateEarnInANutshellModalProps {
    account: Account;
    onCancel: () => void;
    provider: EarnProvider;
    actionType?: EarnModalAction;
    yieldContext?: EarnYieldContext;
}

export const UpdateEarnInANutshellModal = ({
    account,
    onCancel,
    provider,
    actionType,
    yieldContext,
}: UpdateEarnInANutshellModalProps) => {
    const { handleAction, onCancelClick, apy } = useEarnInANutshell({
        flow: EarnFlow.UpdateProvider,
        provider,
        onCancel,
        account,
        actionType,
        yieldContext,
    });

    if (!isStakingNetworkType(account.networkType)) return null;

    const processes: EarnInANutshellProcess[] = [
        {
            heading: <Translation id="TR_EARN_PROVIDER_UPDATE" />,
            badge: <Translation id="TR_TX_FEE" />,
            content: <EarnSupplyingInfo account={account} flow={EarnFlow.UpdateProvider} />,
        },
        {
            heading: <Translation id="TR_EARN_UNSTAKING_PROCESS" />,
            badge: <EarnInANutshellWithdrawalBadge networkType={account.networkType} />,
            content: <EarnWithdrawingInfo account={account} flow={EarnFlow.UpdateProvider} />,
        },
    ];

    return (
        <EarnInANutshellModalLayout
            heading={<Translation id="TR_EARN_STAKING_IN_A_NUTSHELL" />}
            onCancel={onCancelClick}
            actionType={actionType}
            onAction={handleAction}
        >
            <UpdateEarnInANutshellHighlights
                networkType={account.networkType}
                networkSymbol={account.symbol}
                apy={apy}
            />
            <Divider margin={{ top: 24, bottom: 16 }} />
            <EarnInANutshellProcesses items={processes} />
        </EarnInANutshellModalLayout>
    );
};
