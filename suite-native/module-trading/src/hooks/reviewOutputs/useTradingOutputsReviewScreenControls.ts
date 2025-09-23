import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';

import { useConfirmOnTrezorController } from '@suite-native/device';
import { selectIsTransactionAlreadySigned } from '@suite-native/transaction-management';

import { useExchangeFlow } from '../exchange/useExchangeFlow';

export const useTradingOutputsReviewScreenControls = () => {
    const signingExecutedRef = useRef(false);
    const { signAndSendTransaction, isConsentRequested, resolveConsent } = useExchangeFlow();
    const { confirmOnTrezorRef, closeSheet } = useConfirmOnTrezorController();

    const isTransactionAlreadySigned = useSelector(selectIsTransactionAlreadySigned);

    useEffect(() => {
        if (!signingExecutedRef.current && !isTransactionAlreadySigned) {
            signingExecutedRef.current = true;
            signAndSendTransaction();
        }
    }, [signAndSendTransaction, isTransactionAlreadySigned]);

    useEffect(() => {
        if (isTransactionAlreadySigned) {
            closeSheet();
        }
    }, [closeSheet, isTransactionAlreadySigned]);

    return {
        isTransactionAlreadySigned,
        isConsentRequested,
        resolveConsent,
        confirmOnTrezorRef,
    };
};
