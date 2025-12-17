import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';
import type { ExchangeTrade, SellFiatTrade } from 'invity-api';

import {
    TradingExchangeType,
    TradingSellType,
    selectTradingComposedTransactionInfo,
} from '@suite-common/trading';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { AccountKey } from '@suite-common/wallet-types';
import { AnimatedCard } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    StackNavigationProps,
    TradingStackParamList,
    TradingStackRoutes,
} from '@suite-native/navigation';
import { TradeInfoHeader } from '@suite-native/trading-atoms';

import { FeePicker } from './FeePicker';
import { ProviderReceiveAddress } from '../general/ProviderReceiveAddress';

type FeePickerCardProps = {
    trade: ExchangeTrade | SellFiatTrade | undefined;
    accountKey: AccountKey;
    symbol: NetworkSymbol;
    tradingType: TradingSellType | TradingExchangeType;
};

export const FeePickerCard = ({ trade, accountKey, symbol, tradingType }: FeePickerCardProps) => {
    const navigation =
        useNavigation<
            StackNavigationProps<
                TradingStackParamList,
                TradingStackRoutes.TradingExchangePreview | TradingStackRoutes.TradingSellPreview
            >
        >();
    const composedTransactionInfo = useSelector(selectTradingComposedTransactionInfo);

    const actualFee = composedTransactionInfo?.composed?.fee;
    const fee = actualFee ?? '0';

    const handleFeesPressed = () => {
        if (actualFee === undefined) {
            return;
        }
        navigation.navigate(TradingStackRoutes.TradingFees, {
            accountKey,
            tradingType,
        });
    };

    return (
        <AnimatedCard noPadding>
            <TradeInfoHeader
                title={<Translation id="moduleTrading.tradingExchangePreviewScreen.details" />}
            />
            {trade && <ProviderReceiveAddress trade={trade} />}
            <FeePicker
                fee={fee}
                symbol={symbol}
                onPress={handleFeesPressed}
                isLoading={actualFee === undefined}
            />
        </AnimatedCard>
    );
};
