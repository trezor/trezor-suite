import { createThunk } from '@suite-common/redux-utils';
import { TrezorDevice } from '@suite-common/suite-types';
import { notificationsActions } from '@suite-common/toast-notifications';
import { Account } from '@suite-common/wallet-types';
import TrezorConnect, {
    EthereumSignTypedDataMessage,
    EthereumSignTypedDataTypes,
} from '@trezor/connect';

import { exchangeThunks } from '../';
import { TRADING_EXCHANGE_THUNK_PREFIX } from '../../constants';
import { tradingActions } from '../../reducers/tradingReducer';
import {
    selectTradingExchangeAccountKey,
    selectTradingExchangeReceiveAccountKey,
    selectTradingExchangeSelectedQuote,
} from '../../selectors/tradingSelectors';

export type SignDataAndConfirmThunkProps = {
    account: Account;
    device: TrezorDevice | undefined;

    returnUrl: string;
    triggerAnalyticsTradeConfirmation: () => void;
    processResponseData: (response: any) => void;
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
                notificationsActions.addToast({
                    type: 'error',
                    error: 'Cannot sign, missing data',
                }),
            );

            return;
        }

        if (
            account.networkType !== 'ethereum' ||
            selectedQuote.signData.type !== 'eip712-typed-data'
        ) {
            dispatch(
                notificationsActions.addToast({
                    type: 'error',
                    error: 'Cannot sign data, unsupported network',
                }),
            );

            return;
        }

        const typedData = selectedQuote?.signData
            .data as EthereumSignTypedDataMessage<EthereumSignTypedDataTypes>;

        dispatch(tradingActions.setModalAccountKey(account.key));
        const result = await TrezorConnect.ethereumSignTypedData({
            device,
            path: account.path,
            metamask_v4_compat: false,
            data: typedData,
        });

        if (!result.success) {
            dispatch(
                notificationsActions.addToast({
                    type: 'sign-message-error',
                    error: result.payload.error,
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
            exchangeThunks.confirmTradeThunk({
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
