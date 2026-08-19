import { useSelector } from 'react-redux';

import type { SellFiatTrade } from 'invity-api';

import { Box } from '@suite-native/atoms';
import {
    selectSellSelectedSendAccount,
    selectTradingProviderConfirmationStatus,
} from '@suite-native/trading-state';

import { TradeFeeInfoRow } from '../../general/TradeInfo/TradeFeeInfoRow';

export type SellCompletionFeeInfoProps = {
    quote?: SellFiatTrade;
    isTxnError: boolean;
};

export const SellCompletionFeeInfo = ({ quote, isTxnError }: SellCompletionFeeInfoProps) => {
    const fromAccount = useSelector(selectSellSelectedSendAccount);
    const providerConfirmationStatus = useSelector(selectTradingProviderConfirmationStatus);

    const isTradeConfirmedOnProviderSide = providerConfirmationStatus === 'confirmation_success';

    if (!fromAccount || !quote?.cryptoCurrency || isTxnError || !isTradeConfirmedOnProviderSide) {
        return null;
    }

    return (
        <Box flex={1}>
            <TradeFeeInfoRow accountKey={fromAccount.key} tradingType="sell" />
        </Box>
    );
};
