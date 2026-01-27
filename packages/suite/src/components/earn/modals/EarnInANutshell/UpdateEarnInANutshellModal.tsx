import { Translation } from '@suite/intl';
import { EarnFlow, EarnProvider } from '@suite-common/suite-types/src/staking';
import { isStakingNetworkType } from '@suite-common/wallet-utils';
import { Divider } from '@trezor/components';

import { formatApyValue } from 'src/views/wallet/staking/utils/formatStakeValues';

import { EarnInANutshellModalLayout } from './components/EarnInANutshellModalLayout';
import {
    EarnInANutshellProcess,
    EarnInANutshellProcesses,
} from './components/EarnInANutshellProcesses';
import { EarnInANutshellWithdrawalBadge } from './components/EarnInANutshellWithdrawalBadge';
import { EarnSupplyingInfo } from './components/EarnSupplyingInfo';
import { EarnWithdrawingInfo } from './components/EarnWithdrawingInfo';
import { UpdateEarnInANutshellHighlights } from './components/UpdateEarnInANutshellHighlights';
import { useEarnInANutshellActions } from './hooks/useEarnInANutshellActions';
import { useEarnInANutshellData } from './hooks/useEarnInANutshellData';

interface UpdateEarnInANutshellModalProps {
    onCancel: () => void;
    provider: EarnProvider;
}

export const UpdateEarnInANutshellModal = ({
    onCancel,
    provider,
}: UpdateEarnInANutshellModalProps) => {
    const { handleContinue, onCancelClick } = useEarnInANutshellActions({
        flow: EarnFlow.UpdateProvider,
        provider,
        onCancel,
    });

    const data = useEarnInANutshellData();

    if (!data || (data.account && !isStakingNetworkType(data.account.networkType))) {
        return null;
    }

    const { account, displaySymbol, apy } = data;

    if (!account || !displaySymbol) return null;
    if (!isStakingNetworkType(account.networkType)) return null;

    const apyValue = formatApyValue(apy);

    const processes: EarnInANutshellProcess[] = [
        {
            heading: <Translation id="TR_EARN_PROVIDER_UPDATE" />,
            badge: <Translation id="TR_TX_FEE" />,
            content: <EarnSupplyingInfo flow={EarnFlow.UpdateProvider} />,
        },
        {
            heading: <Translation id="TR_EARN_UNSTAKING_PROCESS" />,
            badge: <EarnInANutshellWithdrawalBadge networkType={account.networkType} />,
            content: <EarnWithdrawingInfo flow={EarnFlow.UpdateProvider} />,
        },
    ];

    return (
        <EarnInANutshellModalLayout
            heading={<Translation id="TR_EARN_STAKING_IN_A_NUTSHELL" />}
            onCancel={onCancelClick}
            onContinue={handleContinue}
        >
            <UpdateEarnInANutshellHighlights
                networkType={account.networkType}
                displaySymbol={displaySymbol}
                apy={apyValue}
            />
            <Divider margin={{ top: 24, bottom: 16 }} />
            <EarnInANutshellProcesses items={processes} />
        </EarnInANutshellModalLayout>
    );
};
