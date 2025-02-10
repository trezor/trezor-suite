import { useState } from 'react';

import { notificationsActions } from '@suite-common/toast-notifications';
import {
    DeviceRootState,
    SendState,
    StakeState,
    selectPrecomposedSendForm,
    selectSelectedDevice,
    selectSendFormReviewButtonRequestsCount,
    selectStakePrecomposedForm,
} from '@suite-common/wallet-core';
import { FormState, RbfTransactionType, StakeFormState } from '@suite-common/wallet-types';
import {
    constructTransactionReviewOutputs,
    getTxStakeNameByDataHex,
    isRbfBumpFeeTransaction,
    isRbfCancelTransaction,
    isRbfTransaction,
} from '@suite-common/wallet-utils';
import { NewModal } from '@trezor/components';
import { copyToClipboard, download } from '@trezor/dom-utils';
import { ConfirmOnDevice } from '@trezor/product-components';
import { EventType, TransactionCreatedEvent, analytics } from '@trezor/suite-analytics';
import { Deferred } from '@trezor/utils';

import * as modalActions from 'src/actions/suite/modalActions';
import { Translation } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectIsActionAbortable } from 'src/reducers/suite/suiteReducer';
import { selectAccountIncludingChosenInTrading } from 'src/reducers/wallet/selectedAccountReducer';
import { getTransactionReviewModalActionText } from 'src/utils/suite/transactionReview';

import { TransactionReviewDetails } from './TransactionReviewDetails';
import { TransactionReviewOutputList } from './TransactionReviewOutputList/TransactionReviewOutputList';
import { TransactionReviewSummary } from './TransactionReviewSummary';
import { ConfirmActionModal } from '../DeviceContextModal/ConfirmActionModal';
import { ReplaceByFeeFailedOriginalTxConfirmed } from '../UserContextModal/TxDetailModal/ReplaceByFeeFailedOriginalTxConfirmed';

const isStakeState = (state: SendState | StakeState): state is StakeState => 'data' in state;

const isStakeForm = (form: FormState | StakeFormState): form is StakeFormState =>
    'stakeType' in form;

const mapRbfTypeToReporting: Record<
    RbfTransactionType,
    TransactionCreatedEvent['payload']['action']
> = {
    'bump-fee': 'replaced',
    cancel: 'canceled',
};

type TransactionReviewModalContentProps = {
    decision: Deferred<boolean, string | number | undefined> | undefined;
    txInfoState: SendState | StakeState;
    cancelSignTx: () => void;
    isRbfConfirmedError?: boolean;
};

export const TransactionReviewModalContent = ({
    decision,
    txInfoState,
    cancelSignTx,
    isRbfConfirmedError,
}: TransactionReviewModalContentProps) => {
    const dispatch = useDispatch();
    const account = useSelector(selectAccountIncludingChosenInTrading);
    const device = useSelector(selectSelectedDevice);
    const isActionAbortable = useSelector(selectIsActionAbortable);
    const [isSending, setIsSending] = useState(false);
    const [areDetailsVisible, setAreDetailsVisible] = useState(false);

    const deviceModelInternal = device?.features?.internal_model;
    const { precomposedTx, serializedTx } = txInfoState;

    const precomposedForm = useSelector(state =>
        isStakeState(txInfoState)
            ? selectStakePrecomposedForm(state)
            : selectPrecomposedSendForm(state),
    );

    const isTradingAction = !!precomposedForm?.isTrading;
    const isBumpFeeRbfAction =
        precomposedTx !== undefined && isRbfBumpFeeTransaction(precomposedTx);

    const decreaseOutputId =
        isBumpFeeRbfAction && precomposedTx.useNativeRbf
            ? precomposedForm?.setMaxOutputId
            : undefined;

    const buttonRequestsCount = useSelector((state: DeviceRootState) =>
        selectSendFormReviewButtonRequestsCount(state, account?.symbol, decreaseOutputId),
    );

    if (!device) return null;
    if (!account || !precomposedTx || !precomposedForm) {
        // TODO: special case for Connect Popup
        return <ConfirmActionModal device={device} />;
    }

    const { symbol, networkType } = account;
    const { options, selectedFee } = precomposedForm;

    const outputs = constructTransactionReviewOutputs({
        account,
        decreaseOutputId,
        device,
        precomposedForm,
        precomposedTx,
    });

    // for bump fee we have to analyze tx data which are in outputs[0]
    const stakeType = isStakeForm(precomposedForm)
        ? precomposedForm.stakeType
        : getTxStakeNameByDataHex(outputs[0]?.value);

    const onCancel = () => {
        if (isRbfConfirmedError) {
            dispatch(modalActions.onCancel());
        }

        if (isActionAbortable || serializedTx) {
            cancelSignTx();
            decision?.resolve(false);
        }
    };

    const isCancelRbfAction = isRbfCancelTransaction(precomposedTx);

    const actionLabel = getTransactionReviewModalActionText({
        stakeType,
        isBumpFeeRbfAction,
        isCancelRbfAction,
        isSending,
    });

    const isBroadcastEnabled = options.includes('broadcast');

    const reportTransactionCreatedEvent = (action: TransactionCreatedEvent['payload']['action']) =>
        analytics.report({
            type: EventType.TransactionCreated,
            payload: {
                action,
                symbol,
                tokens: outputs
                    .filter(output => output.token?.symbol)
                    .map(output => output.token?.symbol)
                    .join(','),
                outputsCount: precomposedForm.outputs.length,
                broadcast: isBroadcastEnabled,
                bitcoinLockTime: !!options.includes('bitcoinLockTime'),
                ethereumData: !!options.includes('ethereumData'),
                rippleDestinationTag: !!options.includes('rippleDestinationTag'),
                ethereumNonce: !!options.includes('ethereumNonce'),
                selectedFee: selectedFee || 'normal',
                isCoinControlEnabled: precomposedForm.isCoinControlEnabled,
                hasCoinControlBeenOpened: precomposedForm.hasCoinControlBeenOpened,
            },
        });

    const handleSend = () => {
        if (networkType === 'solana') {
            setIsSending(true);
        }
        if (decision) {
            decision.resolve(true);
            reportTransactionCreatedEvent(
                isRbfTransaction(precomposedTx)
                    ? mapRbfTypeToReporting[precomposedTx.rbfType]
                    : 'sent',
            );
        }
    };

    const handleCopy = () => {
        const result = copyToClipboard(serializedTx!.tx);

        if (typeof result !== 'string') {
            dispatch(
                notificationsActions.addToast({
                    type: 'copy-to-clipboard',
                }),
            );
        }

        reportTransactionCreatedEvent('copied');
    };

    const handleDownload = () => {
        download(serializedTx!.tx, 'signed-transaction.txt');
        reportTransactionCreatedEvent('downloaded');
    };

    const BottomContent = () => {
        if (isRbfConfirmedError) {
            return (
                <NewModal.Button variant="tertiary" onClick={onCancel}>
                    <Translation id="TR_CLOSE" />
                </NewModal.Button>
            );
        }

        if (areDetailsVisible) {
            return null;
        }

        if (isBroadcastEnabled) {
            return (
                <NewModal.Button
                    data-testid="@modal/send"
                    isDisabled={!serializedTx}
                    isLoading={isSending}
                    onClick={handleSend}
                >
                    <Translation id={actionLabel} />
                </NewModal.Button>
            );
        }

        return (
            <>
                <NewModal.Button
                    isDisabled={!serializedTx}
                    onClick={handleCopy}
                    data-testid="@send/copy-raw-transaction"
                >
                    <Translation id="COPY_TRANSACTION_TO_CLIPBOARD" />
                </NewModal.Button>
                <NewModal.Button
                    variant="tertiary"
                    isDisabled={!serializedTx}
                    onClick={handleDownload}
                >
                    <Translation id="DOWNLOAD_TRANSACTION" />
                </NewModal.Button>
            </>
        );
    };

    const Content = () => {
        if (areDetailsVisible) {
            return <TransactionReviewDetails tx={precomposedTx} txHash={serializedTx?.tx} />;
        }

        if (isRbfConfirmedError && isRbfTransaction(precomposedTx)) {
            return <ReplaceByFeeFailedOriginalTxConfirmed type={precomposedTx.rbfType} />;
        }

        return (
            <TransactionReviewOutputList
                account={account}
                precomposedTx={precomposedTx}
                signedTx={serializedTx}
                outputs={outputs}
                buttonRequestsCount={buttonRequestsCount}
                isRbfAction={isBumpFeeRbfAction}
                isTradingAction={isTradingAction}
                isSending={isSending}
                stakeType={stakeType || undefined}
            />
        );
    };

    return (
        <NewModal.Backdrop>
            {!isRbfConfirmedError && (
                <ConfirmOnDevice
                    title={<Translation id="TR_CONFIRM_ON_TREZOR" />}
                    steps={outputs.length + 1}
                    activeStep={serializedTx ? outputs.length + 2 : buttonRequestsCount}
                    deviceModelInternal={deviceModelInternal}
                    deviceUnitColor={device?.features?.unit_color}
                    successText={<Translation id="TR_CONFIRMED_TX" />}
                    onCancel={onCancel}
                />
            )}
            <NewModal.ModalBase
                heading={<Translation id={areDetailsVisible ? 'TR_DETAIL' : actionLabel} />}
                onBackClick={areDetailsVisible ? () => setAreDetailsVisible(false) : undefined}
                description={
                    !areDetailsVisible && (
                        <TransactionReviewSummary
                            tx={precomposedTx}
                            account={account}
                            broadcast={isBroadcastEnabled}
                            onDetailsClick={() => {
                                setAreDetailsVisible(!areDetailsVisible);
                            }}
                            stakeType={stakeType}
                        />
                    )
                }
                bottomContent={<BottomContent />}
                size="small"
            >
                <Content />
            </NewModal.ModalBase>
        </NewModal.Backdrop>
    );
};
