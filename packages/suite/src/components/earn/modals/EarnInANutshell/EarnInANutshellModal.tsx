import { useEffect, useRef } from 'react';

import { selectDesktopAnalyticsDep } from '@suite/analytics';
import { openModal } from '@suite/modal';
import { gotoThunk } from '@suite/router';
import { useServices } from '@suite-common/dependency-injection';
import { selectDispatch } from '@suite-common/redux-utils';
import {
    type EarnAnalyticsStep,
    EarnFlow,
    type EarnModalAction,
    type EarnProvider,
    type EarnYieldContext,
} from '@suite-common/suite-types/src/staking';
import {
    getEarnOpportunityKey,
    getYieldEarnOpportunityKey,
    selectIsEarnOnboardingConfirmed,
} from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { exhaustive } from '@trezor/type-utils';

import { earnFlowToEventTypeMap } from 'src/constants/suite/staking';
import { useSelector } from 'src/hooks/suite';

import { StakingEarnInANutshellModal } from './StakingEarnInANutshellModal';
import { UpdateEarnInANutshellModal } from './UpdateEarnInANutshellModal';
import { YieldEarnInANutshellModal } from './YieldEarnInANutshellModal';
import { getEarnRouteParams } from '../../utils/getEarnRouteParams';

type EarnInANutshellBaseProps = {
    provider: EarnProvider;
    account: Account;
    actionType?: EarnModalAction;
    yieldContext?: EarnYieldContext;
    onCancel: () => void;
};

type StakingEarnInANutshellModalProps = EarnInANutshellBaseProps & {
    flow: EarnFlow.Stake | EarnFlow.UpdateProvider;
    analyticsStep: Extract<EarnAnalyticsStep, 'staking-dashboard'>;
};

type YieldEarnInANutshellModalProps = EarnInANutshellBaseProps & {
    flow: EarnFlow.Yield;
    analyticsStep: Extract<
        EarnAnalyticsStep,
        'earn-dashboard' | 'yield-deposit' | 'yield-withdraw'
    >;
};

type EarnInANutshellModalProps = StakingEarnInANutshellModalProps | YieldEarnInANutshellModalProps;

export const EarnInANutshellModal = ({
    flow,
    provider,
    account,
    analyticsStep,
    actionType,
    yieldContext,
    onCancel,
}: EarnInANutshellModalProps) => {
    const { analytics, dispatch } = useServices(selectDesktopAnalyticsDep, selectDispatch);

    const opportunity =
        flow === EarnFlow.Yield
            ? getYieldEarnOpportunityKey(yieldContext?.vaultAddress)
            : getEarnOpportunityKey({ type: 'staking', provider });
    const isConfirmed = useSelector(state =>
        selectIsEarnOnboardingConfirmed(state, account.key, opportunity),
    );
    // The update-provider flow must always be shown, and an explicit 'close' action means the modal
    // was opened as info only, never as an entry into the earn flow.
    const shouldSkip =
        isConfirmed &&
        (!actionType || actionType === 'continue') &&
        flow !== EarnFlow.UpdateProvider;

    const hasSkipped = useRef(false);

    useEffect(() => {
        if (!shouldSkip || hasSkipped.current) return;
        hasSkipped.current = true;

        onCancel();

        if (flow === EarnFlow.Yield && yieldContext?.vaultAddress) {
            dispatch(
                gotoThunk({
                    routeName: 'earn-yield-deposit',
                    params: getEarnRouteParams({
                        account,
                        vaultAddress: yieldContext.vaultAddress,
                    }),
                }),
            );
        } else if (flow === EarnFlow.Stake) {
            if (account.networkType === 'cardano') {
                // Cardano still needs the provider consent modal for the voting delegation choice;
                // its legal content and checkbox are hidden for a confirmed opportunity.
                dispatch(openModal({ type: 'earn-provider-consent', flow, provider, account }));
            } else {
                dispatch(openModal({ type: 'stake', flow, account }));
            }
        }
    }, [shouldSkip, flow, yieldContext?.vaultAddress, onCancel, account, provider, dispatch]);

    useEffect(() => {
        switch (flow) {
            case EarnFlow.Stake:
            case EarnFlow.UpdateProvider:
                analytics.report({
                    type: earnFlowToEventTypeMap[flow],
                    payload: {
                        action: 'continue',
                        step: analyticsStep,
                        networkSymbol: account.symbol,
                    },
                });
                break;
            case EarnFlow.Yield:
                // analytics are handled directly inside the modal component
                break;
            default:
                exhaustive(flow);
        }
    }, [account.symbol, analytics, analyticsStep, flow]);

    if (shouldSkip) return null;

    switch (flow) {
        case EarnFlow.Stake:
            return (
                <StakingEarnInANutshellModal
                    account={account}
                    onCancel={onCancel}
                    provider={provider}
                    actionType={actionType}
                    yieldContext={yieldContext}
                />
            );
        case EarnFlow.Yield:
            return (
                <YieldEarnInANutshellModal
                    account={account}
                    onCancel={onCancel}
                    provider={provider}
                    actionType={actionType}
                    yieldContext={yieldContext}
                />
            );
        case EarnFlow.UpdateProvider:
            return (
                <UpdateEarnInANutshellModal
                    account={account}
                    onCancel={onCancel}
                    provider={provider}
                    actionType={actionType}
                    yieldContext={yieldContext}
                />
            );
        default:
            return exhaustive(flow);
    }
};
