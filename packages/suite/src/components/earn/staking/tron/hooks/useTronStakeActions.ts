import { useDispatch } from 'react-redux';

import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { setConnectionModal, setConnectionMode, useDevice } from '@suite/device';
import { closeModal, openDeferredModal, preserveModal } from '@suite/modal';
import { useServices } from '@suite-common/dependency-injection';
import { useTronStakingStats } from '@suite-common/earn-staking-api';
import { useSelector } from '@suite-common/redux-utils';
import { TRON_REPRESENTATIVE_TERMS_OF_SERVICE_URLS } from '@suite-common/wallet-constants';
import {
    type TronFlow,
    type TronStakeError,
    type TronStakeStepId,
    selectTronStakeSession,
    submitTronClaimThunk,
    submitTronFreezeThunk,
    submitTronUnstakeThunk,
    submitTronVoteThunk,
    submitTronWithdrawThunk,
    tronStakeActions,
} from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { getTronStakingRewards, getTronWithdrawableBalance } from '@suite-common/wallet-utils';
import { exhaustive } from '@trezor/type-utils';

import { useMessageSystemStaking } from 'src/hooks/suite/useMessageSystemStaking';

import { resolveVotedRepresentativeAddress } from '../voteUtils';
import { type useTronStakeForm } from './useTronStakeForm';

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
    const dispatch = useDispatch();
    const { device } = useDevice();
    const { analytics } = useServices(selectDesktopAnalyticsDep);
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

                const representativeAddress = resolveVotedRepresentativeAddress(
                    form.methods.getValues(),
                );
                const representative = stats.data?.find(
                    ({ address }) => address === representativeAddress,
                );
                const representativeName = representative?.name ?? representativeAddress;

                const termsOfServiceUrl =
                    TRON_REPRESENTATIVE_TERMS_OF_SERVICE_URLS[representativeAddress];

                const requestVoteConsent =
                    representative && termsOfServiceUrl
                        ? async () => {
                              const isConsentGiven = Boolean(
                                  await dispatch(
                                      openDeferredModal({
                                          type: 'tron-vote-consent',
                                          representativeName,
                                          termsOfServiceUrl,
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
                                          votingDelegation: representativeAddress,
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
                        representativeAddress,
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
