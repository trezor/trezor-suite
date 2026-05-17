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
import { YieldClaimingInfo } from './components/YieldClaimingInfo';
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
            badge: <Translation id="TR_TX_FEE_COUNT" values={{ count: 2 }} />,
            content: (
                <YieldSupplyingInfo
                    apy={yieldApy}
                    vault={vault}
                    networkSymbol={account.symbol}
                    supplySymbol={supplySymbol}
                    vaultSymbol={vaultSymbol}
                />
            ),
        },
        {
            heading: <Translation id="TR_EARN_WITHDRAWING_PROCESS" />,
            badge: <Translation id="TR_TX_FEE_COUNT" values={{ count: 1 }} />,
            content: <YieldWithdrawingInfo supplySymbol={supplySymbol} />,
        },
        ...(rewardsSymbols !== undefined && rewardsSymbols.length > 0
            ? [
                  {
                      heading: <Translation id="TR_EARN_CLAIMING_PROCESS" />,
                      badge: <Translation id="TR_TX_FEE_COUNT" values={{ count: 1 }} />,
                      content: <YieldClaimingInfo rewardsSymbols={rewardsSymbols} />,
                  },
              ]
            : []),
    ];

    const handleOnAction = () => {
        analytics.report({
            type: events.yieldNavigateEvent.name,
            payload: {
                action: 'continue',
                from: 'deposit-in-a-nutshell-modal',
                to: 'deposit-morpho-modal',
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
                from: 'deposit-in-a-nutshell-modal',
                to: 'deposit-in-a-nutshell-modal',
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
