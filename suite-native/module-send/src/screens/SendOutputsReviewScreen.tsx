import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';
import { isFulfilled } from '@reduxjs/toolkit';
import { useAtomValue } from 'jotai';

import { useServices } from '@suite-common/dependency-injection';
import { selectDispatch } from '@suite-common/redux-utils';
import { type AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import {
    type SendStackParamList,
    type SendStackRoutes,
    type StackProps,
} from '@suite-native/navigation';
import { cleanupSendFormThunk, sendTransactionThunk } from '@suite-native/send';
import {
    type TransactionReviewOutputsState,
    selectIsTransactionAlreadySigned,
    selectReviewSummaryOutput,
    selectTransactionReviewOutputsFromDraft,
} from '@suite-native/transaction-management';
import { TransactionReviewScreen } from '@suite-native/transaction-review';

import { wasAppLeftDuringReviewAtom } from '../atoms/wasAppLeftDuringReviewAtom';
import { useSendTransactionErrorAlert } from '../hooks/useSendTransactionErrorAlert';
import { navigateOutOfSendFlowAction } from '../utils';

type SendOutputsReviewScreenProps = StackProps<
    SendStackParamList,
    SendStackRoutes.SendOutputsReview
>;

export const SendOutputsReviewScreen = ({ route }: SendOutputsReviewScreenProps) => {
    const { accountKey, tokenContract } = route.params;

    const navigation = useNavigation();
    const { dispatch } = useServices(selectDispatch);

    const wasAppLeftDuringReview = useAtomValue(wasAppLeftDuringReviewAtom);

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    const isTransactionAlreadySigned = useSelector(selectIsTransactionAlreadySigned);

    const { show: showSendTransactionErrorAlert } = useSendTransactionErrorAlert({
        account,
        tokenContract,
    });

    const reviewOutputs =
        useSelector((state: TransactionReviewOutputsState) =>
            selectTransactionReviewOutputsFromDraft(state, 'send', accountKey, tokenContract),
        ) || undefined;

    const summaryOutput =
        useSelector((state: TransactionReviewOutputsState) =>
            selectReviewSummaryOutput(state, 'send', accountKey, tokenContract),
        ) || undefined;

    const onSendTransaction = async () => {
        if (!account) return;

        const sendResponse = await dispatch(
            sendTransactionThunk({
                selectedAccount: account,
                wasAppLeftDuringReview,
            }),
        );

        if (isFulfilled(sendResponse)) {
            const { txid } = sendResponse.payload.payload;

            return txid;
        }

        showSendTransactionErrorAlert();
    };

    const onSendTransactionSuccess = (txid: string) => {
        navigation.dispatch(
            navigateOutOfSendFlowAction({
                accountKey,
                tokenContract,
                txid,
            }),
        );

        dispatch(cleanupSendFormThunk({ accountKey, tokenContract }));
    };

    return (
        <TransactionReviewScreen
            accountKey={accountKey}
            tokenContract={tokenContract}
            reviewOutputs={reviewOutputs}
            summaryOutput={summaryOutput}
            onSendTransaction={onSendTransaction}
            onSendTransactionSuccess={onSendTransactionSuccess}
            isTransactionAlreadySigned={isTransactionAlreadySigned}
            titleTranslationId="moduleSend.review.outputs.title"
            summaryTranslationId="transactionManagement.review.outputs.summary.label"
            sendButtonTranslationId="moduleSend.review.outputs.submitButton"
            sendButtonTestId="@send/send-transaction-button"
        />
    );
};
