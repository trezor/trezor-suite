import { useState } from 'react';
import { useSelector } from 'react-redux';

import {
    type AccountsRootState,
    type SendRootState,
    selectAccountByKey,
    selectSendPrecomposedTx,
} from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { type ExchangeFlowType } from '@suite-native/navigation';
import { useTxValidityTimer } from '@suite-native/transaction-management';

type UseTradingTxValidityTimerProps = {
    accountKey: AccountKey;
    exchangeFlowType?: ExchangeFlowType;
    isBroadcasting: boolean;
    isTransactionAlreadySigned: boolean;
    onRetry: () => void | Promise<void>;
    onCancel: () => void;
};

export const useTradingTxValidityTimer = ({
    accountKey,
    exchangeFlowType,
    isBroadcasting,
    isTransactionAlreadySigned,
    onRetry,
    onCancel,
}: UseTradingTxValidityTimerProps) => {
    const [reviewOpenedAt] = useState(() => Date.now());

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const precomposedTx = useSelector((state: SendRootState) => selectSendPrecomposedTx(state));

    const precomposedTxTimestamp = precomposedTx?.createdTimestamp ?? 0;
    const isPrecomposedTxFromCurrentReview = precomposedTxTimestamp >= reviewOpenedAt;
    const isTxValidityTimerEnabled = exchangeFlowType !== 'sign-data';
    const createdTimestamp =
        isTxValidityTimerEnabled && isPrecomposedTxFromCurrentReview ? precomposedTxTimestamp : 0;

    return useTxValidityTimer({
        networkType: account?.networkType,
        createdTimestamp,
        isBroadcasting,
        isTransactionAlreadySigned,
        onRetry,
        onCancel,
    });
};
