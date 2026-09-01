import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { useDispatch } from '@suite-common/redux-utils';
import { type Account } from '@suite-common/wallet-types';

import { type TradingRootState } from '../reducers/tradingCommonReducer';
import { selectTradingExchangeSelectedQuote } from '../selectors/tradingSelectors';
import { exchangeThunks } from '../thunks/exchange';

const POLLING_TIME = 5000;

export type UseTradingExchangeWatchApprovalProps = {
    account: Account | undefined;
    isEnabled: boolean;
};

export const useTradingExchangeWatchApproval = ({
    account,
    isEnabled,
}: UseTradingExchangeWatchApprovalProps) => {
    const dispatch = useDispatch();
    const status = useSelector(
        (state: TradingRootState) => selectTradingExchangeSelectedQuote(state)?.status,
    );

    useEffect(() => {
        if (!isEnabled || !account || status !== 'APPROVAL_PENDING') {
            return;
        }

        let refreshCount = 1;
        const intervalId = setInterval(() => {
            dispatch(exchangeThunks.watchExchangeApprovalThunk({ account, refreshCount }));
            refreshCount += 1;
        }, POLLING_TIME);

        return () => clearInterval(intervalId);
    }, [account, status, isEnabled, dispatch]);
};
