import { events, injectDesktopAnalytics } from '@suite/analytics';
import { setConnectionModal, setConnectionMode, useDevice } from '@suite/device';
import { closeModal, openDeferredModal, preserveModal } from '@suite/modal';
import { useServices } from '@suite-common/dependency-injection';
import { useTronStakingStats } from '@suite-common/earn-staking-api';
import { injectDispatch } from '@suite-common/redux-utils';
import {
    TRON_REPRESENTATIVE_TERMS_OF_SERVICE_URLS,
    type TronFlow,
    type TronStakeError,
    type TronStakeStepId,
    getCurrentVoteAllocations,
    getTronStakingRewards,
    getTronWithdrawableBalance,
    selectTronStakeSession,
    submitTronClaimThunk,
    submitTronFreezeThunk,
    submitTronUnstakeThunk,
    submitTronVoteThunk,
    submitTronWithdrawThunk,
    tronStakeActions,
} from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { exhaustive } from '@trezor/type-utils';

import { useSelector } from 'src/hooks/suite';
import { useMessageSystemStaking } from 'src/hooks/suite/useMessageSystemStaking';

import { type useTronStakeForm } from './useTronStakeForm';
import { getVotingDelegationAnalyticsValue, parseVoteAllocations } from '../utils/voteUtils';

interface UseTronStakeActionsProps {
    account: Account;
    form: ReturnType<typeof useTronStakeForm>;
    flow: TronFlow;
}

export interface TronStakeActions {
    step: TronStakeStepId;
    goToStep: (step: TronStakeStepId) => void;
    submitAction: () => void;
    isSubmitting: boolean;
    error: TronStakeError | null;
    pendingTxid: string | null;
}

export const useTronStakeActions = ({
    account,
    form,
    flow,
}: UseTronStakeActionsProps): TronStakeActions => {
    const { device } = useDevice();
    const { analytics, dispatch } = useServices(injectDesktopAnalytics, injectDispatch);
    const { stats } = useTronStakingStats();
    const { step, isSubmitting, error, pendingTxid } = useSelector(state =>
        selectTronStakeSession(state, account.key, flow),
    );

    const {
        isStakingDisabled,
        isUnstakingDisabled,
        isClaimingDisabled,
        isVotingDisabled,
        isWithdrawingDisabled,
    } = useMessageSystemStaking(account.symbol);

    const goToStep = (nextStep: TronStakeStepId) =>
        dispatch(tronStakeActions.goToStep({ accountKey: account.key, flow, step: nextStep }));

    const openDeviceConnectionModal = () => {
        if (device?.descriptor?.apiType === 'bluetooth') {
            dispatch(setConnectionMode('bluetooth'));
        }
        dispatch(setConnectionModal(true));
    };

    const submitAction = () => {
        const isDeviceConnected = !!device?.connected && !!device?.available;

        if (!isDeviceConnected || !device) {
            openDeviceConnectionModal();

            return;
        }

        switch (step) {
            case 'freeze': {
                if (isStakingDisabled) break;

                const { amount, resourceType } = form.methods.getValues();
                dispatch(
                    submitTronFreezeThunk({
                        account,
                        device,
                        amount,
                        resourceType,
                        requestPushApproval: async () =>
                            Boolean(
                                await dispatch(openDeferredModal({ type: 'review-transaction' })),
                            ),
                        onSigningStart: () => dispatch(preserveModal()),
                        onSettled: () => dispatch(closeModal()),
                    }),
                );
                break;
            }
            case 'vote': {
                if (isVotingDisabled) break;

                const allocations = parseVoteAllocations(form.methods.getValues('voteAllocations'));
                const votingDelegation = getVotingDelegationAnalyticsValue(allocations, stats.data);

                const votedAddresses = getCurrentVoteAllocations(account).map(
                    ({ address }) => address,
                );
                const newRepresentatives = allocations.flatMap(({ address, count }) => {
                    const representative = stats.data?.find(
                        candidate => candidate.address === address,
                    );
                    const termsOfServiceUrl = TRON_REPRESENTATIVE_TERMS_OF_SERVICE_URLS[address];
                    const isNewlyVotedFor = count > 0 && !votedAddresses.includes(address);

                    return representative && termsOfServiceUrl && isNewlyVotedFor
                        ? [{ address, name: representative.name, termsOfServiceUrl }]
                        : [];
                });

                const requestVoteConsent =
                    newRepresentatives.length > 0
                        ? async () => {
                              const isConsentGiven = Boolean(
                                  await dispatch(
                                      openDeferredModal({
                                          type: 'tron-vote-consent',
                                          representatives: newRepresentatives,
                                      }),
                                  ),
                              );

                              if (!isConsentGiven) {
                                  analytics.report({
                                      type: events.stakingUpdateProviderEvent.name,
                                      payload: {
                                          action: 'cancel',
                                          step: 'stake-form-modal',
                                          networkSymbol: account.symbol,
                                          votingDelegation,
                                      },
                                  });
                              }

                              return isConsentGiven;
                          }
                        : undefined;

                dispatch(
                    submitTronVoteThunk({
                        account,
                        device,
                        flow,
                        allocations,
                        requestVoteConsent,
                        requestPushApproval: async () =>
                            Boolean(
                                await dispatch(openDeferredModal({ type: 'review-transaction' })),
                            ),
                        onSigningStart: () => dispatch(preserveModal()),
                        onSettled: () => dispatch(closeModal()),
                    }),
                );
                break;
            }
            case 'unstake': {
                if (isUnstakingDisabled) break;

                const { amount, resourceType } = form.methods.getValues();
                dispatch(
                    submitTronUnstakeThunk({
                        account,
                        device,
                        amount,
                        resourceType,
                        requestPushApproval: async () =>
                            Boolean(
                                await dispatch(openDeferredModal({ type: 'review-transaction' })),
                            ),
                        onSigningStart: () => dispatch(preserveModal()),
                        onSettled: () => dispatch(closeModal()),
                    }),
                );
                break;
            }
            case 'withdraw':
                if (isWithdrawingDisabled) break;

                form.methods.setValue('amount', getTronWithdrawableBalance(account));
                dispatch(
                    submitTronWithdrawThunk({
                        account,
                        device,
                        requestPushApproval: async () =>
                            Boolean(
                                await dispatch(openDeferredModal({ type: 'review-transaction' })),
                            ),
                        onSigningStart: () => dispatch(preserveModal()),
                        onSettled: () => dispatch(closeModal()),
                    }),
                );
                break;
            case 'claim':
                if (isClaimingDisabled) break;

                form.methods.setValue('amount', getTronStakingRewards(account));
                dispatch(
                    submitTronClaimThunk({
                        account,
                        device,
                        requestPushApproval: async () =>
                            Boolean(
                                await dispatch(openDeferredModal({ type: 'review-transaction' })),
                            ),
                        onSigningStart: () => dispatch(preserveModal()),
                        onSettled: () => dispatch(closeModal()),
                    }),
                );
                break;
            case 'complete':
                break;
            default:
                exhaustive(step);
        }
    };

    return {
        step,
        goToStep,
        submitAction,
        isSubmitting,
        error,
        pendingTxid,
    };
};
