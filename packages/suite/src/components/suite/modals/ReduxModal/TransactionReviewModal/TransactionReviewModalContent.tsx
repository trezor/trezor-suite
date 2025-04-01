import { useEffect, useState } from 'react';

import { notificationsActions } from '@suite-common/toast-notifications';
import { NetworkSymbol, NetworkType } from '@suite-common/wallet-config';
import {
    AccountsState,
    DeviceRootState,
    SendState,
    SerializedTx,
    StakeState,
    selectAccounts,
    selectPrecomposedSendForm,
    selectSelectedDevice,
    selectSendFormReviewButtonRequestsCount,
    selectStakePrecomposedForm,
} from '@suite-common/wallet-core';
import {
    FormState,
    RbfTransactionType,
    ReviewOutput,
    StakeFormState,
    StakeType,
} from '@suite-common/wallet-types';
import {
    constructTransactionReviewOutputs,
    findAccountsByAddress,
    getTxStakeNameByDataHex,
    isRbfBumpFeeTransaction,
    isRbfCancelTransaction,
    isRbfTransaction,
} from '@suite-common/wallet-utils';
import { Column, NewModal, Row } from '@trezor/components';
import TrezorConnect from '@trezor/connect';
import { copyToClipboard, download } from '@trezor/dom-utils';
import { ConfirmOnDevice } from '@trezor/product-components';
import { EventType, TransactionCreatedEvent, analytics } from '@trezor/suite-analytics';
import { spacings } from '@trezor/theme';
import { Deferred } from '@trezor/utils';

import * as modalActions from 'src/actions/suite/modalActions';
import { Translation } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectIsActionAbortable } from 'src/reducers/suite/suiteReducer';
import { selectAccountIncludingChosenInTrading } from 'src/reducers/wallet/selectedAccountReducer';
import { redactRouterUrl } from 'src/utils/suite/analytics';
import { getTransactionReviewModalActionText } from 'src/utils/suite/transactionReview';

import { TransactionReviewDetails } from './TransactionReviewDetails';
import { TransactionReviewOutputList } from './TransactionReviewOutputList/TransactionReviewOutputList';
import { TransactionReviewOutputTimer } from './TransactionReviewOutputList/TransactionReviewOutputTimer';
import { TransactionReviewSummary } from './TransactionReviewSummary';
import { ConfirmActionModal } from '../DeviceContextModal/ConfirmActionModal';
import { ExpiredTxValidity } from '../UserContextModal/TxDetailModal/ExpiredTxValidity';
import { ReplaceByFeeFailedOriginalTxConfirmed } from '../UserContextModal/TxDetailModal/ReplaceByFeeFailedOriginalTxConfirmed';

const getTxValidityTimeoutInMs = (networkType?: NetworkType) => {
    if (networkType === 'solana') {
        // Blockhash required in Solana tx is valid for 1 minute. Leave 15 seconds for tx confirmation.
        return 45 * 1000;
    }

    return 0;
};

const hasTxValidityExpired = (deadline: number) => deadline <= Date.now();

const shouldShowTxValidityTimer = (
    deadline: number,
    outputs: ReviewOutput[],
    symbol: NetworkSymbol,
    accounts: AccountsState,
    buttonRequestsCount: number,
    serializedTx: SerializedTx | undefined,
    stakeType: StakeType | null,
    shouldCheckTxTimeValidity: boolean,
) => {
    if (!shouldCheckTxTimeValidity || hasTxValidityExpired(deadline)) {
        return false;
    }

    const firstOutput = outputs[0];
    const isInternalTransfer =
        firstOutput?.type === 'address' &&
        findAccountsByAddress(symbol, firstOutput.value, accounts).length > 0;

    const isFirstStep = buttonRequestsCount <= 1;
    const isStaking = stakeType && !serializedTx;

    return isInternalTransfer || !isFirstStep || serializedTx || isStaking;
};

const isStakeState = (state: SendState | StakeState): state is StakeState => 'data' in state;

const isStakeForm = (form: FormState | StakeFormState): form is StakeFormState =>
    'stakeType' in form;

const getTxType = (txInfoState: SendState | StakeState, precomposedForm: FormState) => {
    const stakeType = isStakeState(txInfoState) ? 'stake' : undefined;
    const tradeType = precomposedForm.isTrading ? 'trade' : undefined;

    return stakeType ?? tradeType;
};

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
    tryAgainSignTx: () => void;
    cancelSignTx: () => void;
    isRbfConfirmedError?: boolean;
};

export const TransactionReviewModalContent = ({
    decision,
    txInfoState,
    tryAgainSignTx,
    cancelSignTx,
    isRbfConfirmedError,
}: TransactionReviewModalContentProps) => {
    const dispatch = useDispatch();
    const account = useSelector(selectAccountIncludingChosenInTrading);
    const accounts = useSelector(selectAccounts);
    const device = useSelector(selectSelectedDevice);
    const isActionAbortable = useSelector(selectIsActionAbortable);
    const [isSending, setIsSending] = useState(false);
    const [areDetailsVisible, setAreDetailsVisible] = useState(false);
    const deviceModelInternal = device?.features?.internal_model;
    const { precomposedTx, serializedTx } = txInfoState;

    const router = useSelector(state => state.router);

    const precomposedForm = useSelector(state =>
        isStakeState(txInfoState)
            ? selectStakePrecomposedForm(state)
            : selectPrecomposedSendForm(state),
    );

    const shouldCheckTxTimeValidity =
        account?.networkType === 'solana' && !precomposedForm?.isTrading;

    const createdTxTimestamp = txInfoState?.precomposedTx?.createdTimestamp || 0;
    const deadline = createdTxTimestamp + getTxValidityTimeoutInMs(account?.networkType);

    // check if transaction is still valid
    useEffect(() => {
        if (!shouldCheckTxTimeValidity) {
            return;
        }

        const now = Date.now();
        const timeLeft = Math.max(deadline - now, 0);
        let mounted = true;

        const timeoutId = setTimeout(() => {
            if (mounted && !isSending) {
                TrezorConnect.cancel('tx-timeout');
            }
        }, timeLeft);

        return () => {
            mounted = false;
            clearTimeout(timeoutId);
        };
    }, [deadline, isSending, shouldCheckTxTimeValidity]);

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

    const txType = getTxType(txInfoState, precomposedForm);

    const outputs = constructTransactionReviewOutputs({
        account,
        decreaseOutputId,
        device,
        precomposedForm,
        precomposedTx,
    });

    // for bump fee we have to analyze tx data which are in outputs[0], for legacy in outputs[1]
    const stakeType = isStakeForm(precomposedForm)
        ? precomposedForm.stakeType
        : outputs
              .filter(output => output.type === 'data')
              .map(output => getTxStakeNameByDataHex(output?.value))
              .find(type => type) || null;

    const onCancel = () => {
        dispatch(modalActions.onCancel());

        if (isActionAbortable || serializedTx) {
            cancelSignTx();
            decision?.resolve(false);
        }
    };

    const isCancelRbfAction = isRbfCancelTransaction(precomposedTx);

    const isTxExpired = hasTxValidityExpired(deadline);

    const showTxValidityTimer = shouldShowTxValidityTimer(
        deadline,
        outputs,
        symbol,
        accounts,
        buttonRequestsCount,
        serializedTx,
        stakeType,
        shouldCheckTxTimeValidity,
    );

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
                ethereumNonce: !!options.includes('ethereumNonce'),
                rippleDestinationTag: !!options.includes('rippleDestinationTag'),
                selectedFee: selectedFee || 'normal',
                isCoinControlEnabled: precomposedForm.isCoinControlEnabled,
                hasCoinControlBeenOpened: precomposedForm.hasCoinControlBeenOpened,
                txType,
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

            if (stakeType) {
                return analytics.report({
                    type: EventType.StakingConfirm,
                    payload: {
                        action: stakeType,
                        networkSymbol: symbol,
                    },
                });
            }
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

    const handleTryAgain = (cancel: boolean) => {
        if (cancel) {
            TrezorConnect.cancel('tx-timeout');
        }

        tryAgainSignTx();

        analytics.report({
            type: EventType.TransactionRetry,
            payload: { url: redactRouterUrl(router.url) },
        });
    };

    const BottomContent = () => {
        if (isRbfConfirmedError) {
            return (
                <NewModal.Button variant="tertiary" onClick={onCancel}>
                    <Translation id="TR_CLOSE" />
                </NewModal.Button>
            );
        }

        if (shouldCheckTxTimeValidity && isTxExpired && !isSending) {
            return (
                <>
                    <NewModal.Button variant="primary" onClick={() => handleTryAgain(false)}>
                        <Translation id="TR_TRY_AGAIN" />
                    </NewModal.Button>
                    <NewModal.Button variant="tertiary" onClick={onCancel}>
                        <Translation id="TR_CLOSE" />
                    </NewModal.Button>
                </>
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
            return (
                <ReplaceByFeeFailedOriginalTxConfirmed
                    type={precomposedTx.rbfType}
                    networkType={networkType}
                />
            );
        }

        if (shouldCheckTxTimeValidity && isTxExpired && !isSending) {
            return <ExpiredTxValidity symbol={symbol} />;
        }

        return (
            <Column gap={spacings.md}>
                <TransactionReviewOutputList
                    account={account}
                    precomposedTx={precomposedTx}
                    signedTx={serializedTx}
                    outputs={outputs}
                    buttonRequestsCount={buttonRequestsCount}
                    isRbfAction={isBumpFeeRbfAction}
                    isTradingAction={!!precomposedForm.isTrading}
                    isSending={isSending}
                    stakeType={stakeType || undefined}
                    deadline={deadline}
                    onTryAgain={handleTryAgain}
                />
            </Column>
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
                    onCancel={isSending ? undefined : onCancel}
                />
            )}
            <NewModal.ModalBase
                heading={<Translation id={areDetailsVisible ? 'TR_DETAIL' : actionLabel} />}
                onBackClick={areDetailsVisible ? () => setAreDetailsVisible(false) : undefined}
                description={
                    !areDetailsVisible && (
                        <Row justifyContent="space-between">
                            <TransactionReviewSummary
                                tx={precomposedTx}
                                account={account}
                                broadcast={isBroadcastEnabled}
                                onDetailsClick={() => {
                                    setAreDetailsVisible(!areDetailsVisible);
                                }}
                                stakeType={stakeType}
                            />
                            {showTxValidityTimer && (
                                <Row gap={spacings.xs}>
                                    <TransactionReviewOutputTimer
                                        deadline={deadline}
                                        onTryAgain={handleTryAgain}
                                        isMinimal
                                        isSending={isSending}
                                    />
                                </Row>
                            )}
                        </Row>
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
