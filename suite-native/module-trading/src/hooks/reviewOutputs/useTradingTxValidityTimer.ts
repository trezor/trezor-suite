import { useState } from 'react';
import { useSelector } from 'react-redux';

import {
    type AccountsRootState,
    type SendRootState,
    selectAccountByKey,
    selectSendPrecomposedTx,
} from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { useTranslate } from '@suite-native/intl';
import {
    type TxValidityTimerExpiredAlertOptions,
    useTxValidityTimer,
} from '@suite-native/transaction-management';

type UseTradingTxValidityTimerProps = {
    accountKey: AccountKey;
    isBroadcasting: boolean;
    isTransactionAlreadySigned: boolean;
    isDexExchange?: boolean;
    onRetry: () => void | Promise<void>;
    onCancel: () => void;
};

export const useTradingTxValidityTimer = ({
    accountKey,
    isBroadcasting,
    isTransactionAlreadySigned,
    isDexExchange,
    onRetry,
    onCancel,
}: UseTradingTxValidityTimerProps) => {
    const { translate } = useTranslate();
    const [reviewOpenedAt] = useState(() => Date.now());

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const precomposedTx = useSelector((state: SendRootState) => selectSendPrecomposedTx(state));

    const precomposedTxTimestamp = precomposedTx?.createdTimestamp ?? 0;
    const isPrecomposedTxFromCurrentReview = precomposedTxTimestamp >= reviewOpenedAt;
    const createdTimestamp = isPrecomposedTxFromCurrentReview ? precomposedTxTimestamp : 0;

    const expiredAlertOptions: TxValidityTimerExpiredAlertOptions | undefined = isDexExchange
        ? {
              title: translate('moduleTrading.tradingReviewOutputs.expiredAlert.title'),
              description: translate('moduleTrading.tradingReviewOutputs.expiredAlert.description'),
              primaryButtonTitle: translate(
                  'moduleTrading.tradingReviewOutputs.expiredAlert.button',
              ),
              secondaryButtonTitle: null,
          }
        : undefined;

    return useTxValidityTimer({
        networkType: account?.networkType,
        createdTimestamp,
        isBroadcasting,
        isTransactionAlreadySigned,
        onRetry,
        onCancel,
        expiredAlertOptions,
    });
};
