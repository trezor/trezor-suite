import { selectFullSelectedAccount } from '@suite/account';
import { Translation } from '@suite/intl';
import { closeModal } from '@suite/modal';
import { gotoThunk } from '@suite/router';
import {
    cancelSignSendFormTransactionThunk,
    selectPrecomposedSendForm,
    selectSend,
    selectStake,
    selectStakeAccount,
    selectStakePrecomposedForm,
    selectTronStakeTxReview,
    selectYieldTxReview,
    sendFormActions,
    stakeActions,
} from '@suite-common/wallet-core';
import { type FormState } from '@suite-common/wallet-types';
import { Modal } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import {
    removeSendFormDraftThunk,
    signAndPushSendFormTransactionThunk,
} from '#src/actions/wallet/send/sendFormThunks';
import { cancelSignYieldTxThunk } from '#src/actions/wallet/stablecoin-yield/cancelSignYieldTx';
import { waitForSolanaStakingSignatureThunk } from '#src/actions/wallet/stake/stakeFormSolanaActions';
import { cancelSignTxThunk as cancelSignStakingTx } from '#src/actions/wallet/stakeActions';
import { cancelSignTronFreezeTxThunk } from '#src/actions/wallet/tron-stake/cancelSignTronFreezeTx';
import { useSignStakingTransaction } from '#src/hooks/earn/useSignStakingTransaction';
import { useSelector } from '#src/hooks/suite/useSelector';

import {
    TransactionReviewModalBody,
    type TransactionReviewRetry,
} from './TransactionReviewModalBody';
import { TransactionReviewModalExchange } from './TransactionReviewModalExchange';
import { type TransactionReviewModalProps } from './TransactionReviewModalProps';
import { TransactionReviewModalSell } from './TransactionReviewModalSell';
import { type TxInfoState } from './utils';

// This modal is opened either in Device (button request) or User (push tx) context
// contexts are distinguished by `type` prop
export const TransactionReviewModal = ({ type, decision }: TransactionReviewModalProps) => {
    const send = useSelector(selectSend);
    const stake = useSelector(selectStake);
    const yieldTxReview = useSelector(selectYieldTxReview);
    const tronStakeTxReview = useSelector(selectTronStakeTxReview);
    const sendPrecomposedForm = useSelector(selectPrecomposedSendForm);
    const stakePrecomposedForm = useSelector(selectStakePrecomposedForm);
    const stakeAccount = useSelector(selectStakeAccount);
    const signStakingTransaction = useSignStakingTransaction(stakeAccount);
    const selectedAccount = useSelector(selectFullSelectedAccount);
    const { dispatch } = useServices(injectDispatch);

    const getReviewSource = (): {
        txInfoState: TxInfoState;
        precomposedForm: FormState | undefined;
        cancelSignTx: () => void;
    } => {
        if (tronStakeTxReview.precomposedTx) {
            return {
                txInfoState: tronStakeTxReview,
                precomposedForm: tronStakeTxReview.precomposedForm,
                cancelSignTx: () => dispatch(cancelSignTronFreezeTxThunk()),
            };
        }
        if (yieldTxReview.precomposedTx) {
            return {
                txInfoState: yieldTxReview,
                precomposedForm: yieldTxReview.precomposedForm,
                cancelSignTx: () => dispatch(cancelSignYieldTxThunk()),
            };
        }
        if (send?.precomposedTx) {
            return {
                txInfoState: send,
                precomposedForm: sendPrecomposedForm,
                cancelSignTx: () => dispatch(cancelSignSendFormTransactionThunk()),
            };
        }

        return {
            txInfoState: stake,
            precomposedForm: stakePrecomposedForm,
            cancelSignTx: () => dispatch(cancelSignStakingTx()),
        };
    };

    const { txInfoState, precomposedForm, cancelSignTx } = getReviewSource();

    const isRbfConfirmedError = type === 'review-transaction-rbf-previous-transaction-mined-error';
    const isExchange = precomposedForm?.trading?.activeSection === 'exchange';
    const isSell = precomposedForm?.trading?.activeSection === 'sell';

    const handleSignAndPushSendTx = async () => {
        try {
            const result = await dispatch(
                signAndPushSendFormTransactionThunk({
                    formState: send.precomposedForm!,
                    precomposedTransaction: send.precomposedTx!,
                    selectedAccount: selectedAccount.account,
                }),
            ).unwrap();

            if (result?.success) {
                dispatch(removeSendFormDraftThunk());
                dispatch(gotoThunk({ routeName: 'wallet-index', preserveParams: true }));
            }
        } catch {
            // Error state is handled by signAndPushSendFormTransactionThunk.
        }
    };

    const handleTryAgainSignTx = async ({
        cancelPendingSignature,
        resetExpiredReview,
    }: TransactionReviewRetry) => {
        if (send.precomposedForm && send.precomposedTx) {
            cancelPendingSignature();
            resetExpiredReview();
            dispatch(sendFormActions.clearSignedTransactionData());
            await handleSignAndPushSendTx();
        } else if (stake.precomposedForm && stake.precomposedTx) {
            await signStakingTransaction({
                formValues: stake.precomposedForm,
                transactionInfo: stake.precomposedTx,
                beforeDeviceCheck: async () => {
                    cancelPendingSignature();
                    await dispatch(waitForSolanaStakingSignatureThunk());
                },
                beforeSigning: () => {
                    resetExpiredReview();
                    dispatch(stakeActions.dispose());
                },
            });
        }
    };

    if (
        decision &&
        (!precomposedForm || !txInfoState.precomposedTx || (txInfoState === stake && !stakeAccount))
    ) {
        // The device call has finished. The signing thunk is waiting for this decision.
        const closeReview = () => {
            if (txInfoState.serializedTx) cancelSignTx();
            dispatch(closeModal());
            decision.resolve(false);
        };

        return (
            <Modal
                width={400}
                heading={<Translation id="TR_TX_REVIEW_UNAVAILABLE" />}
                description={<Translation id="TR_TX_REVIEW_UNAVAILABLE_DESCRIPTION" />}
                onCancel={closeReview}
                bottomContent={
                    <Modal.Button onClick={closeReview}>
                        <Translation id="TR_CLOSE" />
                    </Modal.Button>
                }
            />
        );
    }

    if (isExchange) {
        return (
            <TransactionReviewModalExchange
                decision={decision}
                txInfoState={txInfoState}
                cancelSignTx={cancelSignTx}
                isRbfConfirmedError={isRbfConfirmedError}
                precomposedForm={precomposedForm}
            />
        );
    }

    if (isSell) {
        return (
            <TransactionReviewModalSell
                decision={decision}
                txInfoState={txInfoState}
                cancelSignTx={cancelSignTx}
                isRbfConfirmedError={isRbfConfirmedError}
                precomposedForm={precomposedForm}
            />
        );
    }

    return (
        <TransactionReviewModalBody
            decision={decision}
            txInfoState={txInfoState}
            tryAgainSignTx={handleTryAgainSignTx}
            cancelSignTx={cancelSignTx}
            isRbfConfirmedError={isRbfConfirmedError}
            precomposedForm={precomposedForm}
        />
    );
};
