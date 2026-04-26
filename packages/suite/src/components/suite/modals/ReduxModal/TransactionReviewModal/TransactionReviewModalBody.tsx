import { useCallback, useEffect, useState } from 'react';

import { events } from '@suite/analytics';
import { selectRouterUrl } from '@suite/router';
import { selectSelectedDevice } from '@suite-common/device';
import { type FormState } from '@suite-common/wallet-types';
import {
    constructTransactionReviewOutputsOptional,
    getTxValidityTimeoutInMs,
    isRbfBumpFeeTransaction,
} from '@suite-common/wallet-utils';
import TrezorConnect from '@trezor/connect';
import { type Deferred } from '@trezor/utils';

import { useSelector } from 'src/hooks/suite';
import { selectAccountIncludingChosenInTrading } from 'src/reducers/wallet/selectedAccountReducer';
import { useAnalytics } from 'src/support/useAnalytics';
import { redactRouterUrl } from 'src/utils/suite/analytics';

import { TransactionReviewModalBodyInner } from './TransactionReviewModalBodyInner';
import { type TxInfoState, isStakeState } from './utils';
import { ConfirmActionModal } from '../DeviceContextModal/ConfirmActionModal';

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
    const analytics = useAnalytics();
    const account = useSelector(selectAccountIncludingChosenInTrading);
    const device = useSelector(selectSelectedDevice);
    const [isSending, setIsSending] = useState(false);
    const { precomposedTx } = txInfoState;
    const [hasTxExpired, setHasTxExpired] = useState(false);

    const url = useSelector(selectRouterUrl);

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
                setHasTxExpired(true);
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

    const outputs = constructTransactionReviewOutputsOptional({
        account,
        decreaseOutputId,
        device,
        precomposedForm,
        precomposedTx,
    });

    const handleTryAgain = useCallback(
        (cancel: boolean) => {
            if (cancel) {
                TrezorConnect.cancel('tx-timeout');
            }

            tryAgainSignTx();

            analytics.report({
                type: events.transactionTimeoutRetryEvent.name,
                payload: { url: redactRouterUrl(url) },
            });
        },
        [tryAgainSignTx, url, analytics],
    );

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

    return (
        <TransactionReviewModalBodyInner
            account={account}
            outputs={outputs}
            decision={decision}
            txInfoState={txInfoState}
            tryAgainSignTx={tryAgainSignTx}
            cancelSignTx={cancelSignTx}
            precomposedForm={precomposedForm}
            precomposedTx={precomposedTx}
            isSending={isSending}
            setIsSending={setIsSending}
            handleTryAgain={handleTryAgain}
            hasTxExpired={hasTxExpired}
            isRbfConfirmedError={isRbfConfirmedError}
        />
    );
};
