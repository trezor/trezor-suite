import { useDevice } from '@suite/device';
import { closeModal, openDeferredModal, preserveModal } from '@suite/modal';
import {
    type TronFlow,
    type TronStakeError,
    type TronStakeStepId,
    composeTronFreezeFeeLevelsThunk,
    selectTronStakeSession,
    submitTronFreezeThunk,
    submitTronUnstakeThunk,
    submitTronVoteThunk,
    tronStakeActions,
} from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { asAmountSubunit, subunitsToUnits } from '@suite-common/wallet-utils';
import { exhaustive } from '@trezor/type-utils';
import { BigNumber } from '@trezor/utils';

import { setConnectionModal, setConnectionMode } from 'src/actions/device/deviceSlice';
import { useDispatch, useSelector } from 'src/hooks/suite';

import { type useTronStakeForm } from './useTronStakeForm';
import { resolveVotedRepresentativeAddress } from '../voteUtils';

interface UseTronStakeActionsProps {
    account: Account;
    form: ReturnType<typeof useTronStakeForm>;
    flow: TronFlow;
}

export interface TronStakeActions {
    step: TronStakeStepId;
    goToStep: (step: TronStakeStepId) => void;
    submitAction: () => void;
    setMax: () => Promise<void>;
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
    const { step, isSubmitting, error, pendingTxid } = useSelector(state =>
        selectTronStakeSession(state, account.key, flow),
    );

    const goToStep = (nextStep: TronStakeStepId) =>
        dispatch(tronStakeActions.goToStep({ accountKey: account.key, flow, step: nextStep }));

    const openDeviceConnectionModal = () => {
        if (device?.descriptor?.apiType === 'bluetooth') {
            dispatch(setConnectionMode('bluetooth'));
        }
        dispatch(setConnectionModal(true));
    };

    const setMax = async () => {
        const resourceType = form.methods.getValues('resourceType');

        const availableBalance = subunitsToUnits({
            value: asAmountSubunit(new BigNumber(account.availableBalance)),
            symbol: account.symbol,
        }).toString();

        const levels = await dispatch(
            composeTronFreezeFeeLevelsThunk({ account, amount: availableBalance, resourceType }),
        )
            .unwrap()
            .catch(() => undefined);

        const feeInSun = levels?.normal?.type === 'final' ? levels.normal.fee : '0';
        const maxInSun = BigNumber.max(new BigNumber(account.availableBalance).minus(feeInSun), 0);

        const maxAmount = subunitsToUnits({
            value: asAmountSubunit(maxInSun),
            symbol: account.symbol,
        }).toString();

        form.methods.setValue('amount', maxAmount, { shouldValidate: true });
    };

    const submitAction = () => {
        const isDeviceConnected = !!device?.connected && !!device?.available;

        if (!isDeviceConnected || !device) {
            openDeviceConnectionModal();

            return;
        }

        switch (step) {
            case 'freeze': {
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
                const representativeAddress = resolveVotedRepresentativeAddress(
                    form.methods.getValues(),
                );
                dispatch(
                    submitTronVoteThunk({
                        account,
                        device,
                        flow,
                        representativeAddress,
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
            case 'complete':
                break;
            default:
                exhaustive(step);
        }
    };

    return { step, goToStep, submitAction, setMax, isSubmitting, error, pendingTxid };
};
