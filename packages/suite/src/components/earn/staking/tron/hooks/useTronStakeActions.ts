import { events, injectDesktopAnalytics } from '@suite/analytics';
import { closeModal, openDeferredModal, preserveModal } from '@suite/modal';
import { selectAccountSigningDevice } from '@suite-common/device';
import {
    formatStakingAmount,
    settleTronUnlocks,
    useStakingAccountPosition,
} from '@suite-common/earn-staking';
import { useTronStakingStats } from '@suite-common/earn-staking-api';
import { type StakingAmount, ZERO_STAKING_AMOUNT } from '@suite-common/earn-staking-common';
import { type TrezorDevice } from '@suite-common/suite-types';
import {
    TRON_REPRESENTATIVE_TERMS_OF_SERVICE_URLS,
    type TronFlow,
    type TronStakeError,
    type TronStakeFreezeResult,
    type TronStakeStepId,
    type TronStakeSubmittedAmount,
    getCurrentVoteAllocations,
    isTronClaimSupported,
    selectTronStakeSession,
    submitTronClaimThunk,
    submitTronFreezeThunk,
    submitTronUnstakeThunk,
    submitTronVoteThunk,
    submitTronWithdrawThunk,
    tronStakeActions,
} from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch, injectGetState } from '@trezor/redux-utils';
import { exhaustive } from '@trezor/type-utils';

import { useStakingDeviceAction } from '#src/hooks/earn/useStakingDeviceAction';
import { useMessageSystemStaking } from '#src/hooks/suite/useMessageSystemStaking';
import { useSelector } from '#src/hooks/suite/useSelector';

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
    submitAction: (onClaimFirmwareOutdated?: () => void) => Promise<void>;
    isSubmitting: boolean;
    error: TronStakeError | null;
    pendingTxid: string | null;
    freeze: TronStakeFreezeResult | null;
    submitted: TronStakeSubmittedAmount | null;
}

export const useTronStakeActions = ({
    account,
    form,
    flow,
}: UseTronStakeActionsProps): TronStakeActions => {
    const runWithDevice = useStakingDeviceAction(account);
    const { analytics, dispatch, getState } = useServices(
        injectDesktopAnalytics,
        injectDispatch,
        injectGetState,
    );
    const { stats } = useTronStakingStats();
    const { step, isSubmitting, error, pendingTxid, freeze, submitted } = useSelector(state =>
        selectTronStakeSession(state, account.key, flow),
    );
    const { position, totals } = useStakingAccountPosition(account.key);

    // The amounts the complete step shows, as the pages showed them before the submit.
    const formatAmount = (amount: StakingAmount) =>
        formatStakingAmount({ amount, networkSymbol: account.symbol });

    const {
        isStakingDisabled,
        isUnstakingDisabled,
        isClaimingDisabled,
        isVotingDisabled,
        isWithdrawingDisabled,
    } = useMessageSystemStaking(account.symbol);

    const goToStep = (nextStep: TronStakeStepId) =>
        dispatch(tronStakeActions.goToStep({ accountKey: account.key, flow, step: nextStep }));

    const submitForDevice = async (device: TrezorDevice, onClaimFirmwareOutdated?: () => void) => {
        const requestPushApproval = () => {
            if (!selectAccountSigningDevice(getState(), account.deviceState, device.path)) {
                return Promise.resolve(false);
            }

            return dispatch(
                openDeferredModal(
                    { type: 'review-transaction' },
                    { devicePath: device.path, cancelWith: false },
                ),
            );
        };

        switch (step) {
            case 'freeze': {
                if (isStakingDisabled) break;

                const { amount, resourceType } = form.methods.getValues();
                await dispatch(
                    submitTronFreezeThunk({
                        account,
                        device,
                        amount,
                        resourceType,
                        requestPushApproval,
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
                                      openDeferredModal(
                                          {
                                              type: 'tron-vote-consent',
                                              representatives: newRepresentatives,
                                          },
                                          { devicePath: device.path, cancelWith: false },
                                      ),
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

                await dispatch(
                    submitTronVoteThunk({
                        account,
                        device,
                        flow,
                        allocations,
                        requestVoteConsent,
                        requestPushApproval,
                        onSigningStart: () => dispatch(preserveModal()),
                        onSettled: () => dispatch(closeModal()),
                    }),
                );
                break;
            }
            case 'unstake': {
                if (isUnstakingDisabled) break;

                const { amount, resourceType } = form.methods.getValues();
                await dispatch(
                    submitTronUnstakeThunk({
                        account,
                        device,
                        amount,
                        resourceType,
                        requestPushApproval,
                        onSigningStart: () => dispatch(preserveModal()),
                        onSettled: () => dispatch(closeModal()),
                    }),
                );
                break;
            }
            case 'withdraw':
                if (isWithdrawingDisabled) break;

                form.methods.setValue(
                    'amount',
                    formatAmount(
                        position === null
                            ? ZERO_STAKING_AMOUNT
                            : settleTronUnlocks({ position, nowMs: Date.now() }).withdrawable,
                    ),
                );
                await dispatch(
                    submitTronWithdrawThunk({
                        account,
                        device,
                        requestPushApproval,
                        onSigningStart: () => dispatch(preserveModal()),
                        onSettled: () => dispatch(closeModal()),
                    }),
                );
                break;
            case 'claim':
                if (isClaimingDisabled) break;
                if (!isTronClaimSupported(device)) {
                    onClaimFirmwareOutdated?.();

                    break;
                }

                form.methods.setValue('amount', formatAmount(totals.rewards));
                await dispatch(
                    submitTronClaimThunk({
                        account,
                        device,
                        requestPushApproval,
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
        submitAction: onClaimFirmwareOutdated =>
            runWithDevice(device => submitForDevice(device, onClaimFirmwareOutdated)),
        isSubmitting,
        error,
        pendingTxid,
        freeze,
        submitted,
    };
};
