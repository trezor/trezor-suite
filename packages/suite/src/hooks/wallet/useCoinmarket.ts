import { useEffect, useState } from 'react';
import { SavingsTradeItemStatus } from 'invity-api';
import useUnmount from 'react-use/lib/useUnmount';
import useTimeoutFn from 'react-use/lib/useTimeoutFn';
import { useDispatch } from 'src/hooks/suite';
import invityAPI from 'src/services/suite/invityAPI';
import { saveTrade as saveSavingsTrade } from 'src/actions/wallet/coinmarketSavingsActions';
import { Account } from 'src/types/wallet';
import type { TradeSavings } from 'src/types/wallet/coinmarketCommonTypes';

export const SavingsTradeFinalStatuses: SavingsTradeItemStatus[] = [
    'Blocked',
    'Cancelled',
    'Completed',
    'Error',
    'Refunded',
];

const shouldRefreshSavingsTrade = (trade?: TradeSavings) =>
    trade?.data?.status && !SavingsTradeFinalStatuses.includes(trade.data.status);

export const useWatchSavingsTrade = (account: Account, trade: TradeSavings) => {
    const REFRESH_SECONDS = 30;
    const dispatch = useDispatch();
    const [refreshCount, setRefreshCount] = useState(0);
    const invokeRefresh = () => {
        if (shouldRefreshSavingsTrade(trade)) {
            setRefreshCount(prevValue => prevValue + 1);
        }
    };
    const [, cancelRefresh, resetRefresh] = useTimeoutFn(invokeRefresh, REFRESH_SECONDS * 1000);

    useUnmount(() => {
        cancelRefresh();
    });

    useEffect(() => {
        if (trade && shouldRefreshSavingsTrade(trade)) {
            cancelRefresh();
            invityAPI.createInvityAPIKey(account.descriptor);
            invityAPI.watchSavingsTrade(trade.data.savingsTradeId, trade.data.id).then(response => {
                if (
                    response.savingsTradeItem?.status &&
                    response.savingsTradeItem?.status !== trade.data.status
                ) {
                    const newDate = new Date().toISOString();
                    const tradeData = {
                        ...trade.data,
                        status: response.savingsTradeItem?.status || 'Error',
                        error: response.error,
                    };
                    dispatch(saveSavingsTrade(tradeData, account, newDate));
                }
            });
            resetRefresh();
        }
    }, [account, cancelRefresh, dispatch, refreshCount, resetRefresh, trade]);
};
