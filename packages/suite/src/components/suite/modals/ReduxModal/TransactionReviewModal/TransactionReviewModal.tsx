import { selectFullSelectedAccount } from '@suite/account';
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
import { type PrecomposedTransactionFinal } from '@suite-common/wallet-types';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';
import { exhaustive } from '@trezor/type-utils';

import {
    removeSendFormDraftThunk,
    signAndPushSendFormTransactionThunk,
} from '#src/actions/wallet/send/sendFormThunks';
import { cancelSignYieldTxThunk } from '#src/actions/wallet/stablecoin-yield/cancelSignYieldTx';
import {
    cancelSignTxThunk as cancelSignStakingTx,
    signTransactionThunk,
} from '#src/actions/wallet/stakeActions';
import { cancelSignTronFreezeTxThunk } from '#src/actions/wallet/tron-stake/cancelSignTronFreezeTx';
import { useSelector } from '#src/hooks/suite/useSelector';

import { TransactionReviewModalBody } from './TransactionReviewModalBody';
import { TransactionReviewModalExchange } from './TransactionReviewModalExchange';
import { type TransactionReviewModalProps } from './TransactionReviewModalProps';
import { TransactionReviewModalSell } from './TransactionReviewModalSell';
import { getReviewSource } from './utils';

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
    const selectedAccount = useSelector(selectFullSelectedAccount);
    const { dispatch } = useServices(injectDispatch);

    const { source, txInfoState, precomposedForm } = getReviewSource({
        tronStakeTxReview,
        yieldTxReview,
        send,
        sendPrecomposedForm,
        stake,
        stakePrecomposedForm,
    });

    const cancelSignTx = () => {
        switch (source) {
            case 'tronStake':
                dispatch(cancelSignTronFreezeTxThunk());
                break;
            case 'yield':
                dispatch(cancelSignYieldTxThunk());
                break;
            case 'send':
                dispatch(cancelSignSendFormTransactionThunk());
                break;
            case 'stake':
                dispatch(cancelSignStakingTx());
                break;
            default:
                exhaustive(source);
        }
    };

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

    const handleStakeTx = async () => {
        if (!stakeAccount) return;

        dispatch(stakeActions.dispose());

        await dispatch(
            signTransactionThunk({
                accountKey: stakeAccount.key,
                formValues: stake.precomposedForm!,
                transactionInfo: stake.precomposedTx as PrecomposedTransactionFinal,
            }),
        );
    };

    const handleTryAgainSignTx = async () => {
        if (send.precomposedForm && send.precomposedTx) {
            dispatch(sendFormActions.clearSignedTransactionData());
            await handleSignAndPushSendTx();
        } else if (stake.precomposedForm && stake.precomposedTx) {
            await handleStakeTx();
        }
    };

    if (isExchange) {
        return (
            <TransactionReviewModalExchange
                decision={decision}
                source={source}
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
                source={source}
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
            source={source}
            txInfoState={txInfoState}
            tryAgainSignTx={handleTryAgainSignTx}
            cancelSignTx={cancelSignTx}
            isRbfConfirmedError={isRbfConfirmedError}
            precomposedForm={precomposedForm}
        />
    );
};
