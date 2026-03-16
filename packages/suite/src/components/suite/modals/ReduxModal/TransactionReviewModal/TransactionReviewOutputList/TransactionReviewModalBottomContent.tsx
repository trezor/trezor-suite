import { useDispatch, useSelector } from 'react-redux';

import { type TransactionCreatedEventAction, events } from '@suite/analytics';
import { type ExtendedMessageDescriptor, Translation } from '@suite/intl';
import { selectConnectPopupCall } from '@suite-common/connect-popup';
import { notificationsActions } from '@suite-common/toast-notifications';
import { type SendState, type StakeState } from '@suite-common/wallet-core';
import {
    type Account,
    type FormState,
    type RbfTransactionType,
    type ReviewOutput,
} from '@suite-common/wallet-types';
import { isRbfCancelTransaction, isRbfTransaction } from '@suite-common/wallet-utils';
import { type StakeType } from '@trezor/blockchain-link-types';
import { Modal } from '@trezor/components';
import { copyToClipboard, download } from '@trezor/dom-utils';
import { type Deferred } from '@trezor/utils';

import { useAnalytics } from 'src/support/useAnalytics';

import { getTxType } from '../utils';

const mapRbfTypeToReporting: Record<RbfTransactionType, TransactionCreatedEventAction> = {
    'bump-fee': 'replaced',
    cancel: 'canceled',
};

type TransactionReviewModalBottomContentProps = {
    decision: Deferred<boolean, string | number | undefined> | undefined;
    isSending: boolean;
    onSend: (send: boolean) => void;
    onCancel: () => void;
    handleTryAgain: (close: boolean) => void;
    txInfoState: SendState | StakeState;
    actionTranslation: ExtendedMessageDescriptor;
    isTxExpired: boolean;
    hasTxExpired: boolean;
    stakeType?: StakeType;
    isRbfConfirmedError?: boolean;
    account: Account;
    precomposedForm: FormState;
    outputs: ReviewOutput[];
};

export const TransactionReviewModalBottomContent = ({
    decision,
    isRbfConfirmedError,
    isSending,
    onSend,
    onCancel,
    handleTryAgain,
    txInfoState,
    actionTranslation,
    isTxExpired,
    hasTxExpired,
    stakeType,
    account,
    precomposedForm,
    outputs,
}: TransactionReviewModalBottomContentProps) => {
    const analytics = useAnalytics();
    const dispatch = useDispatch();
    const connectPopupCall = useSelector(selectConnectPopupCall);
    const { precomposedTx, serializedTx } = txInfoState;

    const { symbol, networkType } = account;
    const { options, selectedFee } = precomposedForm;

    const isBroadcastEnabled = options.includes('broadcast');
    const txType = getTxType(txInfoState, precomposedForm);

    const isCancelRbfAction = precomposedTx ? isRbfCancelTransaction(precomposedTx) : false;

    const createdTxTimestamp = txInfoState?.precomposedTx?.createdTimestamp ?? 0;
    const shouldCheckTxTimeValidity = account?.networkType === 'solana' && createdTxTimestamp !== 0;

    const reportTransactionCreatedEvent = (action: TransactionCreatedEventAction) =>
        analytics.report({
            type: events.transactionCreatedEvent.name,
            payload: {
                action,
                symbol,
                tokens: outputs
                    .filter((output: ReviewOutput) => output.token?.symbol)
                    .map((output: ReviewOutput) => output.token?.symbol)
                    .join(','),
                outputsCount: precomposedForm.outputs.length,
                broadcast: isBroadcastEnabled,
                bitcoinLocktime: !!options.includes('bitcoinLocktime'),
                transactionData: !!options.includes('transactionData'),
                ethereumNonce: !!options.includes('ethereumNonce'),
                destinationTag: !!options.includes('destinationTag'),
                selectedFee: selectedFee || 'normal',
                isCoinControlEnabled: precomposedForm.isCoinControlEnabled,
                hasCoinControlBeenOpened: precomposedForm.hasCoinControlBeenOpened,
                txType: txType as 'stake' | 'trade' | undefined,
            },
        });

    const handleSend = () => {
        if (networkType === 'solana' || networkType === 'stellar') {
            onSend(true);
        }

        if (decision) {
            decision.resolve(true);
            reportTransactionCreatedEvent(
                isRbfTransaction(precomposedTx!)
                    ? mapRbfTypeToReporting[precomposedTx!.rbfType]
                    : 'sent',
            );

            if (stakeType) {
                return analytics.report({
                    type: events.stakingConfirmEvent.name,
                    payload: { action: stakeType, networkSymbol: symbol },
                });
            }
        }
    };

    const handleCopy = () => {
        const result = copyToClipboard(serializedTx!.tx);

        if (typeof result !== 'string') {
            dispatch(notificationsActions.addToast({ type: 'copy-to-clipboard' }));
        }

        reportTransactionCreatedEvent('copied');
    };

    const handleDownload = () => {
        download(serializedTx!.tx, 'signed-transaction.txt');
        reportTransactionCreatedEvent('downloaded');
    };

    if (isRbfConfirmedError) {
        return (
            <Modal.Button intent="neutral" priority="secondary" onClick={onCancel}>
                <Translation id="TR_CLOSE" />
            </Modal.Button>
        );
    }

    if (shouldCheckTxTimeValidity && isTxExpired && !isSending) {
        return (
            <>
                <Modal.Button onClick={() => handleTryAgain(false)}>
                    <Translation id="TR_TRY_AGAIN" />
                </Modal.Button>
                <Modal.Button intent="neutral" priority="secondary" onClick={onCancel}>
                    <Translation id="TR_CLOSE" />
                </Modal.Button>
            </>
        );
    }

    if (connectPopupCall?.state === 'ongoing') {
        return null;
    }

    if (isBroadcastEnabled) {
        return (
            <Modal.Button
                data-testid="@modal/send"
                isDisabled={!serializedTx || hasTxExpired}
                isLoading={isSending}
                intent={isCancelRbfAction ? 'critical' : 'brand'}
                onClick={handleSend}
            >
                <Translation {...actionTranslation} />
            </Modal.Button>
        );
    }

    return (
        <>
            <Modal.Button
                isDisabled={!serializedTx}
                onClick={handleCopy}
                data-testid="@send/copy-raw-transaction"
            >
                <Translation id="COPY_TRANSACTION_TO_CLIPBOARD" />
            </Modal.Button>
            <Modal.Button
                intent="neutral"
                priority="secondary"
                isDisabled={!serializedTx}
                onClick={handleDownload}
            >
                <Translation id="DOWNLOAD_TRANSACTION" />
            </Modal.Button>
        </>
    );
};
