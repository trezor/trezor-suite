import { useEffect, useRef, useState } from 'react';

import { events } from '@suite/analytics';
import { Translation } from '@suite/intl';
import * as modalActions from '@suite/modal';
import type { DeviceRootState } from '@suite-common/device';
import { selectTradingComposedTransactionInfo } from '@suite-common/trading';
import {
    SendState,
    SerializedTx,
    StakeState,
    selectIsTxOutputInternal,
    selectSendFormReviewButtonRequestsCount,
    selectSendFormReviewLastButtonCode,
} from '@suite-common/wallet-core';
import {
    Account,
    FormState,
    GeneralPrecomposedTransactionFinal,
    ReviewOutput,
    StakeType,
} from '@suite-common/wallet-types';
import {
    getStakeType,
    getTxValidityTimeoutInMs,
    isEvmApprovalTx,
    isRbfBumpFeeTransaction,
    isRbfCancelTransaction,
} from '@suite-common/wallet-utils';
import { Modal, Row } from '@trezor/components';
import { spacings } from '@trezor/theme';
import { Deferred } from '@trezor/utils';

import { ConnectModalBackdrop } from 'src/components/suite/ConnectModalBackdrop';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useAnalytics } from 'src/support/useAnalytics';
import { getTransactionReviewModalActionTranslation } from 'src/utils/suite/transactionReview';

import { TransactionReviewModalBottomContent } from './TransactionReviewOutputList/TransactionReviewModalBottomContent';
import { TransactionReviewModalConfirmOnDevice } from './TransactionReviewOutputList/TransactionReviewModalConfirmOnDevice';
import { TransactionReviewModalContent } from './TransactionReviewOutputList/TransactionReviewModalContent';
import { TransactionReviewOutputTimer } from './TransactionReviewOutputList/TransactionReviewOutputTimer';
import { TransactionReviewSummary } from './TransactionReviewSummary';

export const hasTxValidityExpired = (deadline: number) => deadline <= Date.now();

type ShouldShowTxValidityTimerProps = {
    deadline: number;
    buttonRequestsCount: number;
    serializedTx: SerializedTx | undefined;
    stakeType: StakeType | null;
    shouldCheckTxTimeValidity: boolean;
    isInternalTransfer: boolean;
    isTrading: boolean;
};

const shouldShowTxValidityTimer = ({
    deadline,
    buttonRequestsCount,
    serializedTx,
    stakeType,
    shouldCheckTxTimeValidity,
    isInternalTransfer,
    isTrading,
}: ShouldShowTxValidityTimerProps) => {
    if (!shouldCheckTxTimeValidity || hasTxValidityExpired(deadline)) {
        return false;
    }

    const isFirstStep = buttonRequestsCount <= 1;
    const isStaking = stakeType && !serializedTx;

    return isInternalTransfer || !isFirstStep || serializedTx || isStaking || isTrading;
};

export type TransactionReviewModalBodyInnerProps = {
    outputs: ReviewOutput[];
    account: Account;
    decision: Deferred<boolean, string | number | undefined> | undefined;
    txInfoState: SendState | StakeState;
    tryAgainSignTx: () => void;
    cancelSignTx: () => void;
    precomposedForm: FormState;
    precomposedTx: GeneralPrecomposedTransactionFinal;
    isSending: boolean;
    setIsSending: (value: boolean) => void;
    handleTryAgain: (cancel: boolean) => void;
    hasTxExpired: boolean;
    isRbfConfirmedError?: boolean;
};

export const TransactionReviewModalBodyInner = ({
    account,
    outputs,
    decision,
    handleTryAgain,
    precomposedTx,
    txInfoState,
    isRbfConfirmedError,
    cancelSignTx,
    precomposedForm,
    isSending,
    setIsSending,
    hasTxExpired,
}: TransactionReviewModalBodyInnerProps) => {
    const analytics = useAnalytics();
    const dispatch = useDispatch();
    const [areDetailsVisible, setAreDetailsVisible] = useState(false);
    const { symbol, networkType } = account;
    const { options } = precomposedForm;
    const { serializedTx } = txInfoState;
    const tradingToken = useSelector(selectTradingComposedTransactionInfo).composed?.token;

    const isApprovalTx = isEvmApprovalTx(precomposedForm.transactionData);

    const totalRecipients = outputs.filter(({ type }) => type === 'address').length;
    const hasOpReturn = outputs.some(output => output.type === 'opreturn');

    const isBumpFeeRbfAction =
        precomposedTx !== undefined && isRbfBumpFeeTransaction(precomposedTx);

    const decreaseOutputId =
        isBumpFeeRbfAction && precomposedTx.useNativeRbf
            ? precomposedForm?.setMaxOutputId
            : undefined;

    const buttonRequestsCount = useSelector((state: DeviceRootState) =>
        selectSendFormReviewButtonRequestsCount(state, account?.symbol, decreaseOutputId),
    );

    const lastButtonRequestCount = useRef(buttonRequestsCount);

    const lastButtonRequestCode = useSelector((state: DeviceRootState) =>
        selectSendFormReviewLastButtonCode(state, symbol),
    );

    const [reviewStep, setReviewStep] = useState(0);

    const isStellar = networkType === 'stellar';

    useEffect(() => {
        if (lastButtonRequestCount.current < buttonRequestsCount) {
            lastButtonRequestCount.current = buttonRequestsCount;
            if (
                !isStellar && // We don't want to go back for Stellar transactions
                reviewStep === 1 &&
                totalRecipients === 1 && // Currently we only support going bak for =1
                lastButtonRequestCode === 'ButtonRequest_ConfirmOutput' &&
                !hasOpReturn &&
                !isApprovalTx
            ) {
                setReviewStep(prev => prev - 1);
            } else {
                setReviewStep(prev => prev + 1);
            }
        }
    }, [
        isStellar,
        buttonRequestsCount,
        lastButtonRequestCode,
        reviewStep,
        totalRecipients,
        hasOpReturn,
        isApprovalTx,
    ]);

    const isInternalTransfer = useSelector(state =>
        selectIsTxOutputInternal(state, account?.symbol, outputs[0]),
    );

    const createdTxTimestamp = txInfoState?.precomposedTx?.createdTimestamp ?? 0;
    const deadline = createdTxTimestamp + getTxValidityTimeoutInMs(account?.networkType);

    // for bump fee we have to analyze tx data which are in outputs[0], for legacy in outputs[1]
    const stakeType = getStakeType(precomposedForm, outputs);
    const shouldCheckTxTimeValidity = account?.networkType === 'solana' && createdTxTimestamp !== 0;

    const onCancel = () => {
        dispatch(modalActions.onCancel());

        cancelSignTx();
        decision?.resolve(false);
    };

    const isCancelRbfAction = isRbfCancelTransaction(precomposedTx);

    const isTxExpired = hasTxValidityExpired(deadline);

    const showTxValidityTimer = shouldShowTxValidityTimer({
        deadline,
        buttonRequestsCount,
        serializedTx,
        stakeType,
        shouldCheckTxTimeValidity,
        isInternalTransfer,
        isTrading: !!precomposedForm.trading?.activeSection,
    });

    const actionTranslation = (source: 'heading' | 'button') =>
        getTransactionReviewModalActionTranslation({
            symbol,
            stakeType,
            precomposedForm,
            tradingToken,
            isBumpFeeRbfAction,
            isCancelRbfAction,
            isSending,
            source,
        });

    const isBroadcastEnabled = options.includes('broadcast');

    const handleDetailsClick = () => {
        setAreDetailsVisible(areVisible => {
            if (!areVisible) {
                analytics.report({
                    type: events.sendDetailOpenedEvent.name,
                    payload: {
                        assetSymbol: symbol,
                    },
                });
            }

            return !areVisible;
        });
    };

    return (
        <ConnectModalBackdrop canSwitchDevice>
            {!isRbfConfirmedError && (
                <TransactionReviewModalConfirmOnDevice
                    outputs={outputs}
                    serializedTx={serializedTx}
                    isSending={isSending}
                    reviewStep={reviewStep}
                    onCancel={onCancel}
                />
            )}
            <Modal.ModalBase
                heading={
                    <Translation
                        {...(areDetailsVisible
                            ? { id: 'TR_DETAIL' }
                            : actionTranslation('heading'))}
                    />
                }
                onBackClick={areDetailsVisible ? () => setAreDetailsVisible(false) : undefined}
                description={
                    areDetailsVisible ? null : (
                        <TransactionReviewSummary
                            tx={precomposedTx}
                            account={account}
                            broadcast={isBroadcastEnabled}
                            onDetailsClick={handleDetailsClick}
                            stakeType={stakeType}
                            timer={
                                showTxValidityTimer ? (
                                    <Row gap={spacings.xs}>
                                        <TransactionReviewOutputTimer
                                            deadline={deadline}
                                            onTryAgain={handleTryAgain}
                                            isMinimal
                                            isSending={isSending}
                                        />
                                    </Row>
                                ) : undefined
                            }
                        />
                    )
                }
                bottomContent={
                    areDetailsVisible ? null : (
                        <TransactionReviewModalBottomContent
                            decision={decision}
                            isSending={isSending}
                            onSend={setIsSending}
                            onCancel={onCancel}
                            handleTryAgain={handleTryAgain}
                            txInfoState={txInfoState}
                            actionTranslation={actionTranslation('button')}
                            isTxExpired={isTxExpired}
                            hasTxExpired={hasTxExpired}
                            stakeType={stakeType || undefined}
                            isRbfConfirmedError={isRbfConfirmedError}
                            account={account}
                            precomposedForm={precomposedForm}
                            outputs={outputs}
                        />
                    )
                }
                width={600}
            >
                <TransactionReviewModalContent
                    account={account}
                    precomposedTx={precomposedTx}
                    precomposedForm={precomposedForm}
                    serializedTx={serializedTx}
                    isSending={isSending}
                    reviewStep={reviewStep}
                    isRbfConfirmedError={isRbfConfirmedError}
                    onTryAgain={handleTryAgain}
                    areDetailsVisible={areDetailsVisible}
                />
            </Modal.ModalBase>
        </ConnectModalBackdrop>
    );
};
