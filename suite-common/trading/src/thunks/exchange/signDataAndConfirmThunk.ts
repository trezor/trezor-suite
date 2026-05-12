import { type ExchangeTrade } from 'invity-api';

import { createThunk } from '@suite-common/redux-utils';
import { type TrezorDevice } from '@suite-common/suite-types';
import { type Account } from '@suite-common/wallet-types';
import TrezorConnect, {
    type EthereumSignTypedDataMessage,
    type EthereumSignTypedDataTypes,
} from '@trezor/connect';

import { confirmExchangeTradeThunk } from './confirmExchangeTradeThunk';
import { TRADING_EXCHANGE_THUNK_PREFIX } from '../../constants';
import { tradingActions } from '../../reducers/tradingCommonReducer';
import {
    selectTradingExchangeAccountKey,
    selectTradingExchangeReceiveAccountKey,
    selectTradingExchangeSelectedQuote,
} from '../../selectors/tradingSelectors';
import { logErrorThunk } from '../common/logErrorThunk';

export type SignDataAndConfirmThunkProps = {
    account: Account;
    device: TrezorDevice | undefined;

    returnUrl: string;
    triggerAnalyticsTradeConfirmation: () => void;
    processResponseData: (response: ExchangeTrade) => void;
    nextStep: () => void;
};

export const signDataAndConfirmThunk = createThunk(
    `${TRADING_EXCHANGE_THUNK_PREFIX}/signDataAndConfirm`,
    async (
        {
            account,
            device,
            returnUrl,
            triggerAnalyticsTradeConfirmation,
            processResponseData,
            nextStep,
        }: SignDataAndConfirmThunkProps,
        { dispatch, getState },
    ) => {
        const selectedQuote = selectTradingExchangeSelectedQuote(getState());
        const sendAccountKey = selectTradingExchangeAccountKey(getState());
        const receiveAccountKey = selectTradingExchangeReceiveAccountKey(getState());

        if (!selectedQuote?.signData) {
            dispatch(
                logErrorThunk({
                    errorMessage: 'Cannot sign, missing data',
                    tradingType: 'exchange',
                }),
            );

            return;
        }

        if (
            account.networkType !== 'ethereum' ||
            selectedQuote.signData.type !== 'eip712-typed-data'
        ) {
            dispatch(
                logErrorThunk({
                    errorMessage: 'Cannot sign data, unsupported network',
                    tradingType: 'exchange',
                }),
            );

            return;
        }

        const typedData = selectedQuote?.signData
            .data as EthereumSignTypedDataMessage<EthereumSignTypedDataTypes>;

        dispatch(tradingActions.setModalAccountKey(account.key));
        const result = await TrezorConnect.ethereumSignTypedData({
            path: account.path,
            metamask_v4_compat: true,
            data: typedData,
            device: {
                path: device?.path,
                instance: device?.instance,
                state: device?.state,
                useEmptyPassphrase: device?.useEmptyPassphrase,
            },
        });

        if (!result.success) {
            dispatch(
                logErrorThunk({
                    errorMessage: result.error.message,
                    tradingType: 'exchange',
                    toastType: 'sign-message-error',
                }),
            );

            return;
        }

        const trade = {
            ...selectedQuote,
            signature: result.payload.signature,
            status: 'SIGN_DATA' as const,
        };

        if (!trade.receiveAddress) {
            return;
        }

        dispatch(
            tradingActions.saveTrade({
                tradeType: 'exchange',
                date: new Date().toISOString(),
                key: trade.orderId,
                data: trade,
                sendAccountKey,
                receiveAccountKey,
            }),
        );

        await dispatch(
            confirmExchangeTradeThunk({
                trade,
                returnUrl,
                receiveAddress: trade.receiveAddress,
                account,
                triggerAnalyticsTradeConfirmation,
                processResponseData,
                nextStep,
            }),
        );
    },
);
