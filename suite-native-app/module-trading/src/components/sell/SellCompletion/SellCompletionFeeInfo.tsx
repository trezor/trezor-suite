import { useSelector } from 'react-redux';

import type { SellFiatTrade } from 'invity-api';

import { Box } from '@suite-native/atoms';
import { selectSellSelectedSendAccount } from '@suite-native/trading-state';

import { TradeFeeInfoRow } from '../../general/TradeInfo/TradeFeeInfoRow';

export type SellCompletionFeeInfoProps = {
    quote?: SellFiatTrade;
};

export const SellCompletionFeeInfo = ({ quote }: SellCompletionFeeInfoProps) => {
    const fromAccount = useSelector(selectSellSelectedSendAccount);

    if (!fromAccount || !quote?.cryptoCurrency) {
        return null;
    }

    return (
        <Box flex={1}>
            <TradeFeeInfoRow trade={quote} accountKey={fromAccount.key} tradingType="sell" />
        </Box>
    );
};
