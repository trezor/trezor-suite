import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';

import { selectAccountIncludingChosenInTrading } from '@suite/account';
import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { closeModal, preserveModalOnTxTimeout } from '@suite/modal';
import { selectRouterUrl } from '@suite/router';
import { useServices } from '@suite-common/dependency-injection';
import { selectSelectedDevice } from '@suite-common/device';
import { useYieldVaultName } from '@suite-common/earn-stablecoin';
import { selectTradingExchangeSelectedQuote } from '@suite-common/trading';
import { selectStablecoinYieldTxReview } from '@suite-common/wallet-core';
import { type FormState } from '@suite-common/wallet-types';
import {
    constructTransactionReviewOutputsOptional,
    getDecreaseOutputId,
    getTxValidityTimeoutInMs,
} from '@suite-common/wallet-utils';
import TrezorConnect from '@trezor/connect';
import { type Deferred } from '@trezor/utils';

import { useSelector } from 'src/hooks/suite';
import { redactRouterUrl } from 'src/utils/suite/analytics';

import { TransactionReviewModalBodyInner } from './TransactionReviewModalBodyInner';
import { type TxInfoState, isStakeState } from './utils';
import { ConfirmActionModal } from '../DeviceContextModal/ConfirmActionModal';
import { ExpiredTxValidityModal } from '../UserContextModal/TxDetailModal/ExpiredTxValidityModal';

export type TransactionReviewModalBodyProps = {
    decision: Deferred<boolean, string | number | undefined> | undefined;
    txInfoState: TxInfoState;
    tryAgainSignTx: () => void;
    cancelSignTx: () => void;
    isRbfConfirmedError?: boolean;
    precomposedForm?: FormState;
};

export const TransactionReviewModalBody = ({
    decision,
    txInfoState,
    tryAgainSignTx,
    cancelSignTx,
    precomposedForm,
    isRbfConfirmedError,
}: TransactionReviewModalBodyProps) => {
    const { analytics } = useServices(selectDesktopAnalyticsDep);
    const dispatch = useDispatch();
    const account = useSelector(selectAccountIncludingChosenInTrading);
    const device = useSelector(selectSelectedDevice);
    const yieldTxReview = useSelector(selectStablecoinYieldTxReview);
    const swapSlippage = useSelector(selectTradingExchangeSelectedQuote)?.swapSlippage;

    const isYield = Boolean(yieldTxReview);
    const vaultName = useYieldVaultName({ enabled: isYield, account, precomposedForm });
    const availableRewards = isYield ? yieldTxReview.availableRewards : undefined;
    const [isSending, setIsSending] = useState(false);
    const { precomposedTx, serializedTx } = txInfoState;
    const [hasTxReviewExpired, setHasTxReviewExpired] = useState(false);
    const prevSerializedTxRef = useRef(serializedTx);

    const url = useSelector(selectRouterUrl);

    // If the push fails (e.g. ExpiredTxValidity), clearSignedTransactionData clears serializedTx
    // while isSending remains true, blocking the expired-state "Try again" button.
    // Reset isSending so the expired UI can appear.
    useEffect(() => {
        if (prevSerializedTxRef.current && !serializedTx && isSending) {
            setIsSending(false);
        }
        prevSerializedTxRef.current = serializedTx;
    }, [isSending, serializedTx]);

    const createdTxTimestamp = txInfoState?.precomposedTx?.createdTimestamp ?? 0;
    const shouldCheckTxTimeValidity = account?.networkType === 'solana' && createdTxTimestamp !== 0;

    const deadline = createdTxTimestamp + getTxValidityTimeoutInMs(account?.networkType);

    useEffect(() => {
        if (!shouldCheckTxTimeValidity) {
            return;
        }

        const now = Date.now();
        const timeLeft = Math.max(deadline - now, 0);
        let mounted = true;

        const timeoutId = setTimeout(() => {
            if (mounted && !isSending) {
                setHasTxReviewExpired(true);
                dispatch(preserveModalOnTxTimeout());
                TrezorConnect.cancel({ reason: 'tx-timeout' });
            }
        }, timeLeft);

        return () => {
            mounted = false;
            clearTimeout(timeoutId);
        };
    }, [deadline, dispatch, isSending, shouldCheckTxTimeValidity]);

    const decreaseOutputId = getDecreaseOutputId(precomposedTx, precomposedForm);

    const outputs = constructTransactionReviewOutputsOptional({
        account,
        decreaseOutputId,
        device,
        availableRewards,
        precomposedForm,
        precomposedTx,
        vaultName,
        swapSlippage,
    });

    const handleTryAgain = useCallback(
        (cancel: boolean) => {
            if (cancel && !serializedTx && !isSending) {
                dispatch(preserveModalOnTxTimeout());
                TrezorConnect.cancel({ reason: 'tx-timeout' });
            }

            setHasTxReviewExpired(false);
            tryAgainSignTx();

            analytics.report({
                type: events.transactionTimeoutRetryEvent.name,
                payload: { url: redactRouterUrl(url) },
            });
        },
        [dispatch, isSending, serializedTx, tryAgainSignTx, url, analytics],
    );

    const onCancel = () => {
        dispatch(closeModal());

        cancelSignTx();
        decision?.resolve(false);
    };

    if (!device) return null;
    if (
        !account ||
        !precomposedTx ||
        !precomposedForm ||
        (account.networkType === 'cardano' && isStakeState(txInfoState))
    ) {
        // TODO: special case for Connect Popup
        return <ConfirmActionModal device={device} />;
    }

    if (shouldCheckTxTimeValidity && hasTxReviewExpired && !isSending) {
        return <ExpiredTxValidityModal onTryAgain={handleTryAgain} onCancel={onCancel} />;
    }

    return (
        <TransactionReviewModalBodyInner
            account={account}
            outputs={outputs}
            decision={decision}
            txInfoState={txInfoState}
            tryAgainSignTx={tryAgainSignTx}
            cancelSignTx={cancelSignTx}
            precomposedForm={precomposedForm}
            vaultName={vaultName}
            availableRewards={availableRewards}
            precomposedTx={precomposedTx}
            isSending={isSending}
            setIsSending={setIsSending}
            handleTryAgain={handleTryAgain}
            hasTxReviewExpired={hasTxReviewExpired}
            isRbfConfirmedError={isRbfConfirmedError}
        />
    );
};
