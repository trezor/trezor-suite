import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { useServices } from '@suite-common/dependency-injection';
import { useYieldOpportunity } from '@suite-common/earn-stablecoin-api';
import {
    EarnFlow,
    type EarnModalAction,
    type EarnProvider,
    type EarnYieldContext,
} from '@suite-common/suite-types/src/staking';
import { type YieldFlowType } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { getApyPercent, isStakingNetworkType } from '@suite-common/wallet-utils';
import { Divider } from '@trezor/components';

import { EarnInANutshellModalLayout } from './components/EarnInANutshellModalLayout';
import {
    type EarnInANutshellProcess,
    EarnInANutshellProcesses,
} from './components/EarnInANutshellProcesses';
import { YieldClaimingInfo } from './components/YieldClaimingInfo';
import { YieldDepositingInfo } from './components/YieldDepositingInfo';
import { YieldEarnInANutshellHighlights } from './components/YieldEarnInANutshellHighlights';
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
    const { analytics } = useServices(selectDesktopAnalyticsDep);

    const { handleAction, onCancelClick } = useEarnInANutshell({
        flow: EarnFlow.Yield,
        provider,
        onCancel,
        account,
        actionType,
        yieldContext,
    });
    const { data: vault } = useYieldOpportunity(yieldContext?.id);

    if (!isStakingNetworkType(account.networkType)) return null;

    const depositSymbol = vault?.token.symbol ?? '';
    const vaultSymbol = vault?.outputToken?.symbol;
    const rewardsSymbols = vault?.rewardRate.components
        .filter(c => c.yieldSource === 'protocol_incentive')
        .map(c => c.token.symbol);
    const yieldApy =
        vault?.rewardRate?.total != null ? getApyPercent(vault.rewardRate.total) : null;

    const processes: EarnInANutshellProcess[] = [
        {
            processType: 'deposit',
            heading: <Translation id="TR_EARN_DEPOSITING_PROCESS" />,
            badge: <Translation id="TR_TX_FEE_COUNT" values={{ count: 2 }} />,
            content: (
                <YieldDepositingInfo
                    apy={yieldApy}
                    vault={vault}
                    networkSymbol={account.symbol}
                    depositSymbol={depositSymbol}
                    vaultSymbol={vaultSymbol}
                />
            ),
        },
        {
            processType: 'withdraw',
            heading: <Translation id="TR_EARN_WITHDRAWING_PROCESS" />,
            badge: <Translation id="TR_TX_FEE_COUNT" values={{ count: 1 }} />,
            content: <YieldWithdrawingInfo depositSymbol={depositSymbol} />,
        },
        ...(rewardsSymbols !== undefined && rewardsSymbols.length > 0
            ? [
                  {
                      processType: 'claim' as const,
                      heading: <Translation id="TR_EARN_CLAIMING_PROCESS" />,
                      badge: <Translation id="TR_TX_FEE_COUNT" values={{ count: 1 }} />,
                      content: <YieldClaimingInfo rewardsSymbols={rewardsSymbols} />,
                  },
              ]
            : []),
    ];

    const handleProcessToggle = (processType: YieldFlowType, isOpen: boolean) => {
        if (!isOpen) return;

        analytics.report({
            type: events.yieldInteractionEvent.name,
            payload: {
                element: 'in-a-nutshell-process-tab',
                value: processType,
                networkSymbol: account.symbol,
                vaultId: vault?.id,
            },
        });
    };

    const handleOnAction = () => {
        analytics.report({
            type: events.yieldNavigateEvent.name,
            payload: {
                action: 'continue',
                from: 'deposit-in-a-nutshell-modal',
                to: 'deposit-legal-modal',
                networkSymbol: account.symbol,
                vaultId: vault?.id,
            },
        });

        handleAction();
    };

    const handleOnCancel = () => {
        analytics.report({
            type: events.yieldNavigateEvent.name,
            payload: {
                action: 'cancel',
                from: 'deposit-in-a-nutshell-modal',
                to: 'deposit-in-a-nutshell-modal',
                networkSymbol: account.symbol,
                vaultId: vault?.id,
            },
        });

        onCancelClick();
    };

    return (
        <EarnInANutshellModalLayout
            heading={<Translation id="TR_EARN_DEPOSITING_IN_A_NUTSHELL" />}
            onCancel={handleOnCancel}
            actionType={actionType}
            onAction={handleOnAction}
        >
            <YieldEarnInANutshellHighlights
                depositSymbol={depositSymbol}
                vaultSymbol={vaultSymbol}
                rewardsSymbols={rewardsSymbols}
            />
            <Divider margin={{ top: 24, bottom: 16 }} />
            <EarnInANutshellProcesses items={processes} onItemToggle={handleProcessToggle} />
        </EarnInANutshellModalLayout>
    );
};
