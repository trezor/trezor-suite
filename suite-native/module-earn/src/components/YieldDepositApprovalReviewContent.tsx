import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { type TrezorDevice } from '@suite-common/suite-types';
import { type YieldFlowResolvedData } from '@suite-common/wallet-core';
import { selectIsTransactionAlreadySigned } from '@suite-native/transaction-management';

import { EarnReviewSubmittedCard } from './EarnReviewSubmittedCard';
import { YieldReviewScreenLayout } from './YieldReviewScreenLayout';
import { YieldTransactionReviewOutputList } from './YieldTransactionReviewOutputList';
import { useYieldApprovalReview } from '../hooks/useYieldApprovalReview';
import { useYieldApprovalReviewTransaction } from '../hooks/useYieldApprovalReviewTransaction';
import { useYieldReviewActiveStep } from '../hooks/useYieldReviewActiveStep';
import {
    useYieldReviewScreenControls,
    useYieldReviewSheetAutoStart,
} from '../hooks/useYieldReviewScreenControls';
import { type YieldAllowanceFormDraftTransactionType, type YieldApprovalLimitType } from '../types';
import { buildYieldReviewPreview } from '../utils/yieldReviewOutputUtils';

type YieldDepositApprovalReviewContentProps = {
    approvalLimitType?: YieldApprovalLimitType;
    device: TrezorDevice;
    flowData: YieldFlowResolvedData;
    flowKey: string;
    transactionType: YieldAllowanceFormDraftTransactionType;
    vaultTokenName: string;
};

export const YieldDepositApprovalReviewContent = ({
    approvalLimitType,
    device,
    flowData,
    flowKey,
    transactionType,
    vaultTokenName,
}: YieldDepositApprovalReviewContentProps) => {
    const {
        closeSheet,
        confirmOnTrezorRef,
        hasLeftReview,
        markReviewLeave,
        revealConfirmOnTrezorSheet,
    } = useYieldReviewScreenControls();
    const reviewTransaction = useYieldApprovalReviewTransaction({
        accountKey: flowData.account.key,
    });
    const isTransactionAlreadySigned = useSelector(selectIsTransactionAlreadySigned);
    const activeStep = useYieldReviewActiveStep(flowData.account.symbol);
    const isRevokeReview = transactionType === 'revoke';
    const successMessageTranslationId = isRevokeReview
        ? 'earn.yieldDepositRevokeReviewScreen.successMessage'
        : 'earn.yieldDepositApprovalReviewScreen.successMessage';
    const titleTranslationId = isRevokeReview
        ? 'earn.yieldDepositRevokeReviewScreen.title'
        : 'earn.yieldDepositApprovalReviewScreen.title';
    const {
        handleApprovalSubmitted,
        isApprovalSigned,
        isApprovalReviewReady,
        isSendingApproval,
        isSigningApproval,
        leaveReviewFromDeviceCancel,
        startApprovalReview,
    } = useYieldApprovalReview({
        approvalLimitType,
        flowData,
        flowKey,
        onReviewLeave: markReviewLeave,
        transactionType,
    });
    const preview = useMemo(() => {
        if (!reviewTransaction) {
            return null;
        }

        return buildYieldReviewPreview({
            account: flowData.account,
            device,
            formState: reviewTransaction.formState,
            precomposedTransaction: reviewTransaction.precomposedTransaction,
            type: transactionType,
            vaultName: vaultTokenName,
        });
    }, [device, flowData.account, reviewTransaction, transactionType, vaultTokenName]);

    useYieldReviewSheetAutoStart({
        closeSheet,
        hasLeftReview,
        isSigned: isApprovalSigned,
        leaveReviewFromDeviceCancel,
        revealConfirmOnTrezorSheet,
        shouldAutoStartReview: isApprovalReviewReady && !isSigningApproval,
        startReview: startApprovalReview,
    });

    return (
        <YieldReviewScreenLayout
            confirmOnTrezorRef={confirmOnTrezorRef}
            titleTranslationId={titleTranslationId}
            submittedCard={
                isApprovalSigned ? (
                    <EarnReviewSubmittedCard
                        buttonTranslationId="transactions.send"
                        isButtonLoading={isSendingApproval}
                        messageTranslationId={successMessageTranslationId}
                        onButtonPress={handleApprovalSubmitted}
                    />
                ) : undefined
            }
        >
            {preview && (
                <YieldTransactionReviewOutputList
                    accountKey={flowData.account.key}
                    activeStep={activeStep}
                    isSigned={isTransactionAlreadySigned}
                    preview={preview}
                />
            )}
        </YieldReviewScreenLayout>
    );
};
