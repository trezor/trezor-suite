import { isRejected } from '@reduxjs/toolkit';

import { type DeviceRootState, selectSelectedDevice } from '@suite-common/device';
import { getNetwork } from '@suite-common/wallet-config';
import {
    type ComposeSendFormTransactionFeeLevelsThunkState,
    type FeesRootState,
    composeSendFormTransactionFeeLevelsThunk,
    selectConvertedNetworkFeeInfo,
} from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { createThunk } from '@trezor/redux-utils';

import { TRADING_SELL_THUNK_PREFIX } from '../../constants';
import { type TradingRootState, tradingActions } from '../../reducers/tradingCommonReducer';
import {
    selectTradingComposedTransactionInfo,
    selectTradingSellActiveTrade,
    selectTradingSellFormValues,
    selectTradingSellProviders,
    selectTradingSellSelectedQuote,
} from '../../selectors/tradingSelectors';
import { getTradingFormState } from '../../utils';
import { buildRecomposeInputsFromTrade } from '../common/buildRecomposeInputsFromTrade';
import { buildTradingComposeFormState } from '../common/buildTradingComposeFormState';

export type ComposeSellTradeFeeLevelsThunkProps = {
    account: Account;
    decimals: number;
    shouldSendInSats: boolean | undefined;
};

export type ComposeSellTradeFeeLevelsThunkState = ComposeSendFormTransactionFeeLevelsThunkState &
    DeviceRootState &
    FeesRootState &
    TradingRootState;

export const composeSellTradeFeeLevelsThunk = createThunk<
    undefined,
    ComposeSellTradeFeeLevelsThunkProps,
    { state: ComposeSellTradeFeeLevelsThunkState }
>(
    `${TRADING_SELL_THUNK_PREFIX}/composeTradeFeeLevels`,
    async ({ account, decimals, shouldSendInSats }, { dispatch, getState, signal }) => {
        const selectedQuote = selectTradingSellSelectedQuote(getState());
        const activeTrade = selectTradingSellActiveTrade(getState());
        const selectedTrade = activeTrade?.data ?? selectedQuote;
        const partnerAddress = selectedTrade?.destinationAddress;
        const formEstimateAddress = selectTradingSellFormValues(getState())?.outputs[0]?.address;
        const destinationAddress = partnerAddress ?? formEstimateAddress;
        const { composed, selectedFee } = selectTradingComposedTransactionInfo(getState());
        const feeInfo = selectConvertedNetworkFeeInfo(getState(), account.symbol);

        if (
            !selectedTrade ||
            destinationAddress === undefined ||
            !selectedTrade.cryptoStringAmount ||
            !composed ||
            !selectedFee ||
            !feeInfo
        ) {
            return;
        }

        const formState = buildTradingComposeFormState({
            account,
            device: selectSelectedDevice(getState()),
            ...buildRecomposeInputsFromTrade({
                destinationAddress,
                cryptoStringAmount: selectedTrade.cryptoStringAmount,
                destinationPaymentExtraId: selectedTrade.destinationPaymentExtraId,
                shouldSendInSats,
                decimals,
            }),
            setMaxOutputId: undefined,
            composed,
            selectedFee,
            tradingFormState: getTradingFormState({
                activeSection: 'sell',
                providers: selectTradingSellProviders(getState()),
                trade: selectedTrade,
                isSlip24Active: false,
                sendAccountKey: account.key,
            }),
        });

        const composedLevels = await dispatch(
            composeSendFormTransactionFeeLevelsThunk({
                formState,
                composeContext: {
                    account,
                    network: getNetwork(account.symbol),
                    feeInfo,
                    assumeNewAccount: !partnerAddress,
                },
            }),
        );

        if (
            isRejected(composeSendFormTransactionFeeLevelsThunk)(composedLevels) ||
            signal.aborted
        ) {
            return;
        }

        const composedLevel = composedLevels.payload[selectedFee];

        if (!composedLevel || composedLevel.type === 'error') {
            return;
        }

        dispatch(
            tradingActions.saveComposedTransactionInfo({ selectedFee, composed: composedLevel }),
        );
    },
);
