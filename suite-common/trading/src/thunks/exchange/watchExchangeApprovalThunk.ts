import { type ExchangeTrade } from 'invity-api';

import { createThunk } from '@suite-common/redux-utils';
import { type Account } from '@suite-common/wallet-types';

import { TRADING_EXCHANGE_THUNK_PREFIX } from '../../constants';
import { tradingExchangeActions } from '../../reducers/exchangeReducer';
import { type TradingRootState } from '../../reducers/tradingCommonReducer';
import { selectTradingExchangeSelectedQuote } from '../../selectors/tradingSelectors';
import { tradeApi } from '../../tradeApi';

export type WatchExchangeApprovalThunkProps = {
    account: Account;
    refreshCount: number;
};

type WatchExchangeApprovalThunkState = TradingRootState;

// Read-only watch poll: saves the quote only when the backend advances its status.
export const watchExchangeApprovalThunk = createThunk<
    ExchangeTrade | undefined,
    WatchExchangeApprovalThunkProps,
    { state: WatchExchangeApprovalThunkState }
>(
    `${TRADING_EXCHANGE_THUNK_PREFIX}/watchExchangeApproval`,
    async ({ account, refreshCount }, { dispatch, getState }) => {
        const selectedQuote = selectTradingExchangeSelectedQuote(getState());

        if (!selectedQuote) {
            return undefined;
        }

        tradeApi.createApiKey(account.descriptor);

        const response = await tradeApi.watchTrade<'exchange'>(
            selectedQuote,
            'exchange',
            refreshCount,
        );

        if (!response.status || response.status === selectedQuote.status) {
            return undefined;
        }

        const updatedQuote = {
            ...selectedQuote,
            status: response.status,
            error: response.error,
            approvalType: undefined,
        };

        dispatch(tradingExchangeActions.saveSelectedQuote(updatedQuote));

        return updatedQuote;
    },
);
