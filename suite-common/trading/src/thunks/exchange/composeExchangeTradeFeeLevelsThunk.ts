import { isRejected } from '@reduxjs/toolkit';

import { createThunk } from '@suite-common/redux-utils';
import { type Account } from '@suite-common/wallet-types';

import { buildExchangeComposeInputs } from './buildExchangeComposeInputs';
import { TRADING_EXCHANGE_THUNK_PREFIX } from '../../constants';
import { tradingActions } from '../../reducers/tradingCommonReducer';
import {
    selectTradingExchangeActiveTrade,
    selectTradingExchangeProviders,
    selectTradingExchangeReceiveAccountKey,
    selectTradingExchangeSelectedQuote,
} from '../../selectors/tradingSelectors';
import { getTradingFormState } from '../../utils';
import { hasEip712SignDataType } from '../../utils/exchange/exchangeUtils';
import {
    type ComposeTradingTransactionThunkState,
    composeTradingTransactionThunk,
} from '../common/composeTradingTransactionThunk';

export type ComposeExchangeTradeFeeLevelsThunkProps = {
    account: Account;
    decimals: number;
    shouldSendInSats: boolean | undefined;
};

export type ComposeExchangeTradeFeeLevelsThunkState = ComposeTradingTransactionThunkState;

export const composeExchangeTradeFeeLevelsThunk = createThunk<
    undefined,
    ComposeExchangeTradeFeeLevelsThunkProps,
    { state: ComposeExchangeTradeFeeLevelsThunkState }
>(
    `${TRADING_EXCHANGE_THUNK_PREFIX}/composeTradeFeeLevels`,
    async ({ account, decimals, shouldSendInSats }, { dispatch, getState, signal }) => {
        const selectedQuote = selectTradingExchangeSelectedQuote(getState());
        const activeTrade = selectTradingExchangeActiveTrade(getState());
        const selectedTrade = activeTrade?.data ?? selectedQuote;

        if (!selectedTrade || hasEip712SignDataType(selectedTrade)) {
            return;
        }

        const composeInputs = buildExchangeComposeInputs({
            selectedQuote,
            selectedTrade,
            networkType: account.networkType,
            decimals,
            shouldSendInSats,
        });

        if (!composeInputs) {
            return;
        }

        const { recomposeInputs, trade } = composeInputs;
        const composeResult = await dispatch(
            composeTradingTransactionThunk({
                account,
                ...recomposeInputs,
                setMaxOutputId: undefined,
                tradingFormState: getTradingFormState({
                    activeSection: 'exchange',
                    providers: selectTradingExchangeProviders(getState()),
                    trade,
                    isSlip24Active: false,
                    sendAccountKey: account.key,
                    receiveAccountKey: selectTradingExchangeReceiveAccountKey(getState()),
                }),
            }),
        );

        if (isRejected(composeTradingTransactionThunk)(composeResult)) {
            return;
        }

        if (signal.aborted) {
            return;
        }

        const { formState, precomposedTransaction } = composeResult.payload;

        dispatch(
            tradingActions.saveComposedTransactionInfo({
                selectedFee: formState.selectedFee,
                composed: precomposedTransaction,
            }),
        );
    },
);
