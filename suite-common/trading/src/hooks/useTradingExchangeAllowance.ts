import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { type Account } from '@suite-common/wallet-types';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { type TradingRootState } from '../reducers/tradingCommonReducer';
import {
    selectTradingExchangeSelectedQuote,
    selectTradingExchangeSelectedQuoteAllowance,
} from '../selectors/tradingSelectors';
import { fetchExchangeAllowanceThunk } from '../thunks/exchange/fetchExchangeAllowanceThunk';
import {
    getExchangeAllowanceKey,
    getExchangeCurrentAllowance,
} from '../utils/exchange/exchangeAllowanceUtils';

export type UseTradingExchangeAllowanceParams = {
    account: Account | undefined;
};

export const useTradingExchangeAllowance = ({ account }: UseTradingExchangeAllowanceParams) => {
    const { dispatch } = useServices(injectDispatch);
    const accountKey = account?.key;
    const quote = useSelector(selectTradingExchangeSelectedQuote);
    const allowance = useSelector((state: TradingRootState) =>
        selectTradingExchangeSelectedQuoteAllowance(state, accountKey),
    );

    const allowanceKey = getExchangeAllowanceKey({ accountKey, quote });
    const tokenContractAddress = allowanceKey?.tokenContractAddress;
    const spender = allowanceKey?.spender;
    const isAllowanceTracked = allowance !== undefined;

    useEffect(() => {
        if (!accountKey || !tokenContractAddress || !spender || isAllowanceTracked) {
            return;
        }

        dispatch(fetchExchangeAllowanceThunk({ accountKey, tokenContractAddress, spender }));
    }, [accountKey, tokenContractAddress, spender, isAllowanceTracked, dispatch]);

    const refetchAllowance = async () => {
        if (!allowanceKey) {
            return;
        }

        await dispatch(fetchExchangeAllowanceThunk(allowanceKey));
    };

    const currentAllowance = getExchangeCurrentAllowance({ allowance, quote });

    return {
        allowance,
        allowanceKey,
        currentAllowance,
        isFirstReadRunning: allowance?.status === 'loading' && allowance.amount === undefined,
        chainAllowance: currentAllowance.source === 'chain' ? currentAllowance.amount : undefined,
        refetchAllowance,
    };
};
