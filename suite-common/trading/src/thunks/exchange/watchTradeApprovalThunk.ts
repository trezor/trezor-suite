import { ExchangeTrade } from 'invity-api';

import { createThunk } from '@suite-common/redux-utils';
import { Account } from '@suite-common/wallet-types';

import { exchangeThunks } from '../';
import { TRADING_EXCHANGE_THUNK_PREFIX } from '../../constants';
import { invityAPI } from '../../invityAPI';
import { tradingExchangeActions } from '../../reducers/exchangeReducer';
import { selectTradingExchangeSelectedQuote } from '../../selectors/tradingSelectors';
import { TradingExchangeType } from '../../types';

export type WatchTradeApprovalThunkThunk = {
    account: Account;
    returnUrl: string;
    refreshCount: number;

    triggerAnalyticsTradeConfirmation: () => void;
    processResponseData: (response: ExchangeTrade) => void;
    nextStep: () => void;
};

export const watchTradeApprovalThunk = createThunk(
    `${TRADING_EXCHANGE_THUNK_PREFIX}/watchTradeApproval`,
    async (
        {
            account,
            returnUrl,
            refreshCount,
            triggerAnalyticsTradeConfirmation,
            processResponseData,
            nextStep,
        }: WatchTradeApprovalThunkThunk,
        { dispatch, getState },
    ) => {
        const selectedQuote = selectTradingExchangeSelectedQuote(getState());

        if (!selectedQuote) return;

        const response = await invityAPI.watchTrade<TradingExchangeType>(
            selectedQuote,
            'exchange',
            refreshCount,
        );

        if (!response.status || response.status === selectedQuote.status) {
            return;
        }

        const updatedSelectedQuote = {
            ...selectedQuote,
            status: response.status,
            error: response.error,
            approvalType: undefined,
        };

        dispatch(tradingExchangeActions.saveSelectedQuote(updatedSelectedQuote));

        if (!updatedSelectedQuote.dexTx || !updatedSelectedQuote.receiveAddress) {
            return;
        }

        await dispatch(
            exchangeThunks.confirmTradeThunk({
                returnUrl,
                receiveAddress: updatedSelectedQuote.receiveAddress,
                account,
                trade: updatedSelectedQuote,
                triggerAnalyticsTradeConfirmation,
                processResponseData,
                nextStep,
            }),
        );
    },
);
