import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

import { NetworkSymbol } from '@suite-common/wallet-config';
import {
    DeviceRootState,
    selectSendFormReviewButtonRequestsCount,
    selectSendFormReviewLastButtonCode,
} from '@suite-common/wallet-core';

import { getTransactionReviewState } from '../getTransactionReviewState';

/**
 * Review state progress is not equal to button requests count since you can go back and forth.
 */
export const useTransactionReviewState = ({
    totalRecipients,
    hasOpReturn,
    hasSignedTx,
    symbol,
    decreaseOutputId,
    defaultReviewStep = 1,
}: {
    totalRecipients: number;
    hasOpReturn: boolean;
    hasSignedTx: boolean;
    symbol: NetworkSymbol;
    decreaseOutputId: number;
    defaultReviewStep?: number;
}) => {
    const [state, setState] = useState<'confirmed' | 'unconfirmed' | 'active'>('unconfirmed');

    const buttonRequestsCount = useSelector((state: DeviceRootState) =>
        selectSendFormReviewButtonRequestsCount(state, symbol, decreaseOutputId),
    );

    const lastButtonRequestCount = useRef(buttonRequestsCount);

    const lastButtonRequestCode = useSelector((state: DeviceRootState) =>
        selectSendFormReviewLastButtonCode(state, symbol),
    );

    const [reviewStep, setReviewStep] = useState(defaultReviewStep);

    useEffect(() => {
        if (lastButtonRequestCount.current < buttonRequestsCount) {
            lastButtonRequestCount.current = buttonRequestsCount;
            if (
                reviewStep === 1 &&
                lastButtonRequestCode === 'ButtonRequest_ConfirmOutput' &&
                totalRecipients === 1 &&
                !hasOpReturn
            ) {
                setReviewStep(prev => prev - 1);
            } else {
                setReviewStep(prev => prev + 1);
            }
        }
    }, [buttonRequestsCount, lastButtonRequestCode, reviewStep, totalRecipients, hasOpReturn]);

    useEffect(() => {
        // totalRecipients * 2 is here, because each recipient has two outputs (one for the address and one for the amount)
        setState(
            getTransactionReviewState(
                totalRecipients * 2 + 1,
                reviewStep,
                hasSignedTx,
                lastButtonRequestCode,
            ),
        );
    }, [reviewStep, totalRecipients, hasSignedTx, lastButtonRequestCode]);

    return {
        reviewStep,
        state,
    };
};
