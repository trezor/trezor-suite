import { useDispatch } from 'react-redux';

import { useNavigation } from '@react-navigation/native';
import type { ExchangeTrade, FormResponse } from 'invity-api';

import { exchangeThunks } from '@suite-common/trading';
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

    const handleWebview = (
        trade: ExchangeTrade,
        formData: FormResponse['form'],
        returnUrl: string,
    ) => {
        const source = getSourceForForm(formData);
        if (!source) {
            return;
        }

        rootNavigation.navigate(RootStackRoutes.TradingWebView, {
            closeCallbackUrl: returnUrl,
            source,
            orderId: trade?.orderId,
        });
    };

    const confirmTrade = async ({
        receiveAddress,
        extraField,
        trade,
        approvalFlow,
        sendAccount,
    }: TradingExchangeConfirmTradeProps & { sendAccount: any }): Promise<boolean> => {
        if (!trade || !sendAccount) {
            return false;
        }

        const returnUrl = buildTradingUrl({
            actionType: 'trade',
            tradeType: 'exchange',
            orderId: trade.orderId,
            exchange: trade.exchange,
        });

        return await dispatch(
            exchangeThunks.confirmTradeThunk({
                returnUrl,
                receiveAddress,
                account: sendAccount,
                extraField,
                trade,
                approvalFlow,
                triggerAnalyticsTradeConfirmation: () => {},
                processResponseData: formResponse =>
                    handleWebview(trade, formResponse.tradeForm?.form, returnUrl),
                nextStep: () => {},
            }),
        ).unwrap();
    };

    return {
        confirmTrade,
    };
};
