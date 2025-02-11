import { ExchangeTrade } from 'invity-api';

import { createThunk } from '@suite-common/redux-utils';
import { Account } from '@suite-common/wallet-types';

import { exchangeThunks, tradingThunks } from '../';
import { TRADING_EXCHANGE_THUNK_PREFIX } from '../../constants';
import { tradingActions } from '../../reducers/tradingReducer';
import {
    selectTradingExchangeAccountKey,
    selectTradingExchangeReceiveAccountKey,
    selectTradingExchangeSelectedQuote,
} from '../../selectors/tradingSelectors';
import { TradingSendRejectedProps } from '../../types';
import { RecomposeAndSignTxThunkProps } from '../common/recomposeAndSignTxThunk';

export type SendDexTransactionThunkProps = {
    account: Account;
    returnUrl: string;
    setMaxOutputId?: number | undefined;

    nextStep: () => void;
    processResponseData: (response: ExchangeTrade) => void;
    triggerAnalyticsTradeConfirmation: () => void;
    signAndPushSendFormTransaction: RecomposeAndSignTxThunkProps['signAndPushSendFormTransaction'];
};

export const sendDexTransactionThunk = createThunk<
    undefined,
    SendDexTransactionThunkProps,
    {
        rejectValue: TradingSendRejectedProps;
    }
>(
    `${TRADING_EXCHANGE_THUNK_PREFIX}/sendDexTransaction`,
    async (
        {
            account,
            returnUrl,
            setMaxOutputId,
            nextStep,
            processResponseData,
            triggerAnalyticsTradeConfirmation,
            signAndPushSendFormTransaction,
        }: SendDexTransactionThunkProps,
        { dispatch, getState, rejectWithValue },
    ) => {
        const selectedQuote = selectTradingExchangeSelectedQuote(getState());
        const sendAccountKey = selectTradingExchangeAccountKey(getState());
        const receiveAccountKey = selectTradingExchangeReceiveAccountKey(getState());

        if (
            !selectedQuote ||
            !selectedQuote.dexTx ||
            !selectedQuote.receiveAddress ||
            (selectedQuote.status !== 'APPROVAL_REQ' && selectedQuote.status !== 'CONFIRM')
        ) {
            return rejectWithValue({
                type: 'error',
                error: { id: 'TR_TRADING_CANNOT_SEND_TRANSACTION' },
            });
        }

        // after discussion with 1inch, adjust the gas limit by the factor of 1.25
        // swap can use different swap paths when mining tx than when estimating tx
        // the geth gas estimate may be too low
        const { payload } = await dispatch(
            tradingThunks.recomposeAndSignTxThunk({
                account,
                address: selectedQuote.dexTx.to,
                amount: selectedQuote.dexTx.value,
                destinationTag: selectedQuote.partnerPaymentExtraId,
                ethereumDataHex: selectedQuote.dexTx.data,
                recalculateCustomLimit: true,
                ethereumAdjustGasLimit: selectedQuote.status === 'CONFIRM' ? '1.25' : undefined,
                setMaxOutputId,
                signAndPushSendFormTransaction,
            }),
        );

        if (!payload || 'error' in payload || !payload.success) {
            return rejectWithValue({
                type: payload && 'type' in payload ? payload.type : 'sign-tx-error',
                error:
                    payload && 'error' in payload
                        ? payload.error
                        : { id: 'TR_TRADING_CANNOT_SEND_TRANSACTION' },
            });
        }

        const { txid } = payload.payload;
        const trade = {
            ...selectedQuote,
            receiveAddress: selectedQuote.receiveAddress, // just for type assurance
        };

        if (selectedQuote.status === 'CONFIRM' && selectedQuote.approvalType !== 'ZERO') {
            trade.receiveTxHash = txid;
            trade.status = 'CONFIRMING';

            dispatch(
                tradingActions.saveTrade({
                    tradeType: 'exchange',
                    date: new Date().toISOString(),
                    key: trade.orderId,
                    account: {
                        descriptor: account.descriptor,
                        symbol: account.symbol,
                        accountType: account.accountType,
                        accountIndex: account.index,
                    },
                    data: trade,
                    sendAccountKey,
                    receiveAccountKey,
                }),
            );
        } else {
            trade.approvalSendTxHash = txid;
            trade.status = 'APPROVAL_PENDING';
        }

        await dispatch(
            exchangeThunks.confirmTradeThunk({
                trade,
                returnUrl,
                receiveAddress: trade.receiveAddress,
                account,
                triggerAnalyticsTradeConfirmation,
                processResponseData,
                nextStep,
            }),
        );
    },
);
