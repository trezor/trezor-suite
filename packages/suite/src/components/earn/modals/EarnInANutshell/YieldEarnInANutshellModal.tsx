import { events } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { RewardDtoYieldSource } from '@suite-common/earn-stablecoin-api';
import {
    EarnFlow,
    type EarnModalAction,
    type EarnProvider,
    type EarnYieldContext,
} from '@suite-common/suite-types/src/staking';
import { type Account } from '@suite-common/wallet-types';
import { getApyPercent, isStakingNetworkType } from '@suite-common/wallet-utils';
import { Divider } from '@trezor/components';

import { useAnalytics } from 'src/support/useAnalytics';

import { EarnInANutshellModalLayout } from './components/EarnInANutshellModalLayout';
import {
    type EarnInANutshellProcess,
    EarnInANutshellProcesses,
} from './components/EarnInANutshellProcesses';
import { YieldEarnInANutshellHighlights } from './components/YieldEarnInANutshellHighlights';
import { YieldSupplyingInfo } from './components/YieldSupplyingInfo';
import { YieldWithdrawingInfo } from './components/YieldWithdrawingInfo';
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
    const analytics = useAnalytics();

    const { handleAction, onCancelClick, vault } = useEarnInANutshell({
        flow: EarnFlow.Yield,
        provider,
        onCancel,
        account,
        actionType,
        yieldContext,
    });

    if (!isStakingNetworkType(account.networkType)) return null;

    const supplySymbol = vault?.token.symbol ?? '';
    const vaultSymbol = vault?.outputToken?.symbol;
    const rewardsSymbols = vault?.rewardRate.components
        .filter(c => c.yieldSource === RewardDtoYieldSource.protocol_incentive)
        .map(c => c.token.symbol);
    const yieldApy =
        vault?.rewardRate?.total != null ? getApyPercent(vault.rewardRate.total) : null;

    const processes: EarnInANutshellProcess[] = [
        {
            heading: <Translation id="TR_EARN_SUPPLYING_PROCESS" />,
            badge: <Translation id="TR_TX_FEE" />,
            content: (
                <YieldSupplyingInfo apy={yieldApy} vault={vault} networkSymbol={account.symbol} />
            ),
        },
        {
            heading: <Translation id="TR_EARN_WITHDRAWING_PROCESS" />,
            badge: <Translation id="TR_TX_FEE" />,
            content: <YieldWithdrawingInfo supplySymbol={supplySymbol} />,
        },
    ];

    const handleOnAction = () => {
        analytics.report({
            type: events.yieldNavigateEvent.name,
            payload: {
                action: 'continue',
                from: 'supply-in-a-nutshell-modal',
                to: 'supply-morpho-modal',
                networkSymbol: account.symbol,
                contractAddress: vault?.token.address,
            },
        });

        handleAction();
    };

    const handleOnCancel = () => {
        analytics.report({
            type: events.yieldNavigateEvent.name,
            payload: {
                action: 'cancel',
                from: 'supply-in-a-nutshell-modal',
                to: 'supply-in-a-nutshell-modal',
                networkSymbol: account.symbol,
                contractAddress: vault?.token.address,
            },
        });

        onCancelClick();
    };

    return (
        <EarnInANutshellModalLayout
            heading={<Translation id="TR_EARN_SUPPLYING_IN_A_NUTSHELL" />}
            onCancel={handleOnCancel}
            actionType={actionType}
            onAction={handleOnAction}
        >
            <YieldEarnInANutshellHighlights
                supplySymbol={supplySymbol}
                vaultSymbol={vaultSymbol}
                rewardsSymbols={rewardsSymbols}
            />
            <Divider margin={{ top: 24, bottom: 16 }} />
            <EarnInANutshellProcesses items={processes} />
        </EarnInANutshellModalLayout>
    );
};
