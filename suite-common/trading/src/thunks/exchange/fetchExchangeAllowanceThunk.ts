import {
    type AccountsRootState,
    fetchAllowance,
    selectAccountByKey,
} from '@suite-common/wallet-core';
import { findToken, subunitsToUnits } from '@suite-common/wallet-utils';
import { createThunk } from '@trezor/redux-utils';

import { TRADING_EXCHANGE_THUNK_PREFIX } from '../../constants';
import { tradingExchangeActions } from '../../reducers/exchangeReducer';
import { type TradingRootState } from '../../reducers/tradingCommonReducer';
import { selectTradingExchangeAllowance } from '../../selectors/tradingSelectors';
import { type TradingExchangeAllowanceKey } from '../../types';
import { isSameExchangeAllowanceKey } from '../../utils/exchange/exchangeAllowanceUtils';

export type FetchExchangeAllowanceThunkState = TradingRootState & AccountsRootState;

/**
 * Reads `allowance(owner, spender)` of the token from the chain and tracks it in the exchange
 * state. A read already in flight for the same key is reused.
 */
export const fetchExchangeAllowanceThunk = createThunk<
    void,
    TradingExchangeAllowanceKey,
    { state: FetchExchangeAllowanceThunkState }
>(
    `${TRADING_EXCHANGE_THUNK_PREFIX}/fetchExchangeAllowance`,
    async (key, { dispatch, getState }) => {
        const trackedAllowance = selectTradingExchangeAllowance(getState());

        if (
            trackedAllowance?.status === 'loading' &&
            isSameExchangeAllowanceKey(trackedAllowance, key)
        ) {
            return;
        }

        dispatch(tradingExchangeActions.startAllowanceRead(key));

        const account = selectAccountByKey(getState(), key.accountKey);
        const token = findToken(account?.tokens, key.tokenContractAddress);

        if (!account || !token) {
            dispatch(
                tradingExchangeActions.setAllowanceError({
                    ...key,
                    errorMessage: account ? 'Unknown token' : 'Unknown account',
                }),
            );

            return;
        }

        try {
            const allowanceSubunits = await fetchAllowance({
                owner: account.descriptor,
                spender: key.spender,
                tokenContractAddress: key.tokenContractAddress,
                coin: account.symbol,
            });
            const amount = subunitsToUnits({
                value: allowanceSubunits,
                decimals: token.decimals,
            }).toString();

            dispatch(tradingExchangeActions.setAllowance({ ...key, amount }));
        } catch (error) {
            dispatch(
                tradingExchangeActions.setAllowanceError({
                    ...key,
                    errorMessage: error instanceof Error ? error.message : String(error),
                }),
            );
        }
    },
);
