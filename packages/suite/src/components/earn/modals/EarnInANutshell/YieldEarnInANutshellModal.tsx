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
import { YieldEarnInANutshellHighlights } from './components/YieldEarnInANutshellHighlights';
import { useEarnInANutshellActions } from './hooks/useEarnInANutshellActions';
import { useEarnInANutshellData } from './hooks/useEarnInANutshellData';

interface YieldEarnInANutshellModalProps {
    onCancel: () => void;
    provider: EarnProvider;
    accountRef?: EarnAccountRef;
    yieldId?: string;
    tokenContractAddress?: string;
}

export const YieldEarnInANutshellModal = ({
    onCancel,
    provider,
    accountRef,
    yieldId,
    tokenContractAddress,
}: YieldEarnInANutshellModalProps) => {
    const { handleContinue, onCancelClick } = useEarnInANutshellActions({
        flow: EarnFlow.Yield,
        provider,
        onCancel,
        accountRef,
        yieldId,
        tokenContractAddress,
    });
    const data = useEarnInANutshellData();

    if (!data) return null;

    const { account: selectedAccount, displaySymbol, unstakingPeriod } = data;

    if (!selectedAccount || !displaySymbol) return null;
    if (!isStakingNetworkType(selectedAccount.networkType)) return null;

    const processes: EarnInANutshellProcess[] = [
        {
            heading: <Translation id="TR_EARN_SUPPLYING_PROCESS" />,
            badge: <Translation id="TR_TX_FEE" />,
            content: <EarnSupplyingInfo flow={EarnFlow.Yield} />,
        },
        {
            heading: <Translation id="TR_EARN_WITHDRAWING_PROCESS" />,
            badge: <EarnInANutshellWithdrawalBadge networkType={selectedAccount.networkType} />,
            content: <EarnWithdrawingInfo flow={EarnFlow.Yield} />,
        },
    ];

    return (
        <EarnInANutshellModalLayout
            heading={<Translation id="TR_EARN_SUPPLYING_IN_A_NUTSHELL" />}
            onCancel={onCancelClick}
            onContinue={handleContinue}
        >
            <YieldEarnInANutshellHighlights
                networkType={selectedAccount.networkType}
                displaySymbol={displaySymbol}
                unstakingPeriod={unstakingPeriod}
            />
            <Divider margin={{ top: 24, bottom: 16 }} />
            <EarnInANutshellProcesses items={processes} />
        </EarnInANutshellModalLayout>
    );
};
