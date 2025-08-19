import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';
import type { ExchangeTrade, FormResponse } from 'invity-api';

import {
    exchangeThunks,
    selectTradingExchangeFormStep,
    selectTradingExchangeSelectedQuote,
} from '@suite-common/trading';
import {
    RootStackParamList,
    RootStackRoutes,
    StackNavigationProps,
} from '@suite-native/navigation';

import { buildTradingUrl, getSourceForForm } from '../../utils/general/formUtils';

type TradingExchangeConfirmTradeProps = {
    receiveAddress: string;
    extraField?: string;
    trade?: ExchangeTrade;
    approvalFlow?: boolean;
};

export const useExchangeFlow = () => {
    const dispatch = useDispatch();
    const rootNavigation =
        useNavigation<StackNavigationProps<RootStackParamList, RootStackRoutes>>();

    const selectedQuote = useSelector(selectTradingExchangeSelectedQuote);

    const formStep = useSelector(selectTradingExchangeFormStep);

    const handleWebview = useCallback(
        (trade: ExchangeTrade, formData: FormResponse['form'], returnUrl: string) => {
            const source = getSourceForForm(formData);
            if (!source) {
                return;
            }

            rootNavigation.navigate(RootStackRoutes.TradingWebView, {
                closeCallbackUrl: returnUrl,
                source,
                orderId: trade?.orderId,
            });
        },
        [rootNavigation],
    );

    const getCommonFunctions = useCallback(
        (trade?: ExchangeTrade) => {
            const tradeToUse = trade ?? selectedQuote;

            if (!tradeToUse) {
                return;
            }

            const returnUrl = buildTradingUrl({
                actionType: 'trade',
                tradeType: 'exchange',
                orderId: trade?.orderId,
                exchange: trade?.exchange,
            });

            const triggerAnalyticsTradeConfirmation = () => {
                // TODO: add analytics
            };

            const processResponseData = (response: ExchangeTrade) =>
                handleWebview(tradeToUse, response.tradeForm?.form, returnUrl);

            const nextStep = () => {};

            return {
                returnUrl,
                triggerAnalyticsTradeConfirmation,
                processResponseData,
                nextStep,
            };
        },
        [handleWebview, selectedQuote],
    );

    const confirmTrade = async ({
        receiveAddress,
        extraField,
        trade,
        approvalFlow,
        sendAccount,
    }: TradingExchangeConfirmTradeProps & { sendAccount: any }): Promise<boolean> => {
        const commonFunctions = await getCommonFunctions(trade);

        if (!trade || !sendAccount || !commonFunctions) {
            return false;
        }

        return await dispatch(
            exchangeThunks.confirmTradeThunk({
                returnUrl: commonFunctions.returnUrl,
                receiveAddress,
                account: sendAccount,
                extraField,
                trade,
                approvalFlow,
                triggerAnalyticsTradeConfirmation:
                    commonFunctions.triggerAnalyticsTradeConfirmation,
                processResponseData: commonFunctions.processResponseData,
                nextStep: commonFunctions.nextStep,
            }),
        ).unwrap();
    };

    return {
        confirmTrade,
        formStep,
    };
};
