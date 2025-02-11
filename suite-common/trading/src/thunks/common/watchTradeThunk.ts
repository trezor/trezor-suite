import { createThunk } from '@suite-common/redux-utils';
import { UnreachableCaseError } from '@suite-common/suite-utils';
import { Account } from '@suite-common/wallet-types';

import { TRADING_THUNK_PREFIX } from '../../constants';
import { invityAPI } from '../../invityAPI';
import { tradingActions } from '../../reducers/tradingReducer';
import {
    TradingTradeMapProps,
    TradingTransaction,
    TradingType,
    TradingWatchTradeResponsePropsMap,
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

const watchTradeData = async <T extends TradingType>({
    trade,
    refreshCount,
}: WatchTradeDataProps): Promise<WatchTradeDataResultProps<T> | undefined> => {
    const response = await invityAPI.watchTrade<T>(trade.data, trade.tradeType, refreshCount);

    if (!response || !response.status || response.status === trade.data.status) return;

    const tradeData = {
        ...trade.data,
        status: response.status,
        error: response.error,
    } as TradingTradeMapProps[T];

    return {
        tradeData,
        response,
    };
};

export const watchTradeThunk = createThunk(
    `${TRADING_THUNK_PREFIX}/watchTrade`,
    async ({ account, trade, refreshCount }: WatchTradeThunk, { dispatch }) => {
        invityAPI.createInvityAPIKey(account.descriptor);

        const { tradeType } = trade;
        const accountData = {
            descriptor: account.descriptor,
            symbol: account.symbol,
            accountType: account.accountType,
            accountIndex: account.index,
        };
        const date = new Date().toISOString();

        switch (tradeType) {
            case 'buy': {
                const data = await watchTradeData<typeof tradeType>({
                    trade,
                    refreshCount,
                });

                if (!data) return;

                dispatch(
                    tradingActions.saveTrade({
                        tradeType,
                        date,
                        key: data.tradeData.paymentId,
                        account: accountData,
                        data: data.tradeData,
                    }),
                );

                return;
            }
            case 'sell':
                // TODO: trading - add watch trade for sell
                break;
            case 'exchange': {
                const data = await watchTradeData<typeof tradeType>({
                    trade,
                    refreshCount,
                });

                if (!data) return;

                if (data.response.sendAddress) {
                    data.tradeData.sendAddress = data.response.sendAddress;
                    data.tradeData.partnerPaymentExtraId = data.response.partnerPaymentExtraId;
                }

                dispatch(
                    tradingActions.saveTrade({
                        tradeType,
                        date,
                        key: data.tradeData.orderId,
                        account: accountData,
                        data: data.tradeData,
                        sendAccountKey: trade.sendAccountKey,
                        receiveAccountKey: trade.receiveAccountKey,
                    }),
                );

                return;
            }
            /* istanbul ignore next */
            default:
                throw new UnreachableCaseError(tradeType, 'Unexpected trade type');
        }
    },
);
