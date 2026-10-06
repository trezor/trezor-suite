import { type ReactNode } from 'react';

import type { ExchangeTrade, SellFiatTrade } from 'invity-api';

import { type TradingExchangeType, type TradingSellType } from '@suite-common/trading';
import { type AccountKey } from '@suite-common/wallet-types';
import { Card, Divider } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { ProviderInfoRow } from './ProviderInfoRow';
import { TradeFeeInfoRow } from './TradeFeeInfoRow';

const dividerStyle = prepareNativeStyle(utils => ({
    borderBottomColor: utils.colors.borderNeutral,
}));

type TradeInfoProps = {
    trade: ExchangeTrade | SellFiatTrade | undefined;
    accountKey: AccountKey;
    tradingType: TradingSellType | TradingExchangeType;
    children?: ReactNode;
};

export const TradeInfo = ({ trade, accountKey, tradingType, children }: TradeInfoProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Card noPadding>
            <ProviderInfoRow exchange={trade?.exchange} tradingType={tradingType} noBorder />
            <Divider style={applyStyle(dividerStyle)} />
            <TradeFeeInfoRow accountKey={accountKey} tradingType={tradingType} />
            {children}
        </Card>
    );
};
