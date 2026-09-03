import { createThunk } from '@suite-common/redux-utils';
import { type Account } from '@suite-common/wallet-types';
import { exhaustive } from '@trezor/type-utils';
import { typedObjectKeys } from '@trezor/utils';

import { TRADING_THUNK_PREFIX } from '../../constants';
import { tradingBuyActions } from '../../reducers/buyReducer';
import { tradingExchangeActions } from '../../reducers/exchangeReducer';
import { tradingSellActions } from '../../reducers/sellReducer';
import { type TradingRootState, tradingActions } from '../../reducers/tradingCommonReducer';
import {
    selectTradingBuySelectedQuote,
    selectTradingExchangeSelectedQuote,
    selectTradingSellSelectedQuote,
} from '../../selectors/tradingSelectors';
import { tradeApi } from '../../tradeApi';
import {
    type TradingTradeMapProps,
    type TradingTransaction,
    type TradingType,
    type TradingWatchTradeResponsePropsMap,
} from '../../types';

export type WatchTradeThunk = {
    account: Account;
    trade: TradingTransaction;
    refreshCount: number;
};

type WatchTradeDataProps = {
    trade: TradingTransaction;
    refreshCount: number;
};

type WatchTradeDataResultProps<T extends TradingType> = {
    tradeData: TradingTradeMapProps[T];
    response: TradingWatchTradeResponsePropsMap[T];
};

const getDefinedWatchUpdates = <T extends TradingType>(
    response: TradingWatchTradeResponsePropsMap[T],
): Partial<TradingTradeMapProps[T]> =>
    Object.fromEntries(
        Object.entries(response).filter(([, value]) => value !== undefined),
    ) as Partial<TradingTradeMapProps[T]>;

const watchTradeData = async <T extends TradingType>({
    trade,
    refreshCount,
}: WatchTradeDataProps): Promise<WatchTradeDataResultProps<T> | undefined> => {
    const response = await tradeApi.watchTrade<T>(trade.data, trade.tradeType, refreshCount);

    if (!response) {
        return;
    }

    const updates = {
        ...getDefinedWatchUpdates(response),
        // always apply, even if undefined
        status: response.status,
        error: response.error,
    };
    const updateKeys = typedObjectKeys(updates);

    const hasChanges = updateKeys.some(
        key => trade.data[key as keyof typeof trade.data] !== updates[key],
    );

    if (!hasChanges) {
        return;
    }

    const tradeData = {
        ...trade.data,
        ...updates,
    } as TradingTradeMapProps[T];

    return {
        tradeData,
        response,
    };
};

type WatchTradeThunkState = TradingRootState;

export const watchTradeThunk = createThunk<void, WatchTradeThunk, { state: WatchTradeThunkState }>(
    `${TRADING_THUNK_PREFIX}/watchTrade`,
    async ({ account, trade, refreshCount }, { dispatch, getState }) => {
        tradeApi.createApiKey(account.descriptor);

        const { tradeType } = trade;

        switch (tradeType) {
            case 'buy': {
                const data = await watchTradeData<typeof tradeType>({
                    trade,
                    refreshCount,
                });

                if (!data) {
                    return;
                }

                const selectedQuote = selectTradingBuySelectedQuote(getState());

                if (selectedQuote?.paymentId === data.tradeData.paymentId) {
                    dispatch(tradingBuyActions.saveSelectedQuote(data.tradeData));
                }

                dispatch(
                    tradingActions.saveTrade({
                        tradeType,
                        date: trade.date,
                        key: data.tradeData.paymentId,
                        data: data.tradeData,
                        receiveAccountKey: trade.receiveAccountKey,
                        selectedAccountKey: account.key,
                    }),
                );

                return;
            }

            case 'sell': {
                const data = await watchTradeData<typeof tradeType>({
                    trade,
                    refreshCount,
                });

                if (!data) {
                    return;
                }

                if (data.response.destinationAddress) {
                    // make sure destinationPaymentExtraId is not stale even when empty
                    data.tradeData.destinationPaymentExtraId =
                        data.response.destinationPaymentExtraId;
                }

                const selectedQuote = selectTradingSellSelectedQuote(getState());

                if (selectedQuote?.orderId === data.tradeData.orderId) {
                    dispatch(tradingSellActions.saveSelectedQuote(data.tradeData));
                }

                dispatch(
                    tradingActions.saveTrade({
                        tradeType,
                        date: trade.date,
                        key: data.tradeData.orderId,
                        data: data.tradeData,
                        sendAccountKey: trade.sendAccountKey,
                    }),
                );

                return;
            }

            case 'exchange': {
                const data = await watchTradeData<typeof tradeType>({
                    trade,
                    refreshCount,
                });

                if (!data) {
                    return;
                }

                const selectedQuote = selectTradingExchangeSelectedQuote(getState());

                if (selectedQuote?.orderId === data.tradeData.orderId) {
                    dispatch(tradingExchangeActions.saveSelectedQuote(data.tradeData));
                }

                dispatch(
                    tradingActions.saveTrade({
                        tradeType,
                        date: trade.date,
                        key: data.tradeData.orderId,
                        data: data.tradeData,
                        sendAccountKey: trade.sendAccountKey,
                        receiveAccountKey: trade.receiveAccountKey,
                    }),
                );

                return;
            }

            /* istanbul ignore next */
            default:
                return exhaustive(tradeType);
        }
    },
);
