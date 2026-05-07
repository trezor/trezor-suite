import { useSelector } from 'react-redux';

import {
    type TradingRootState,
    type TradingType,
    selectTradingProviderByNameAndTradeType,
    selectTradingTradeByOrderId,
} from '@suite-common/trading';
import { Card, HStack, Text } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation, useTranslate } from '@suite-native/intl';
import { Link, useOpenLink } from '@suite-native/link';
import { ProviderLogo } from '@suite-native/trading-atoms';

import { TradeDetailInfoRow } from './TradeDetailInfoRow';

type TradeProviderCardProps = {
    orderId: string;
};

type ProviderCardContentProps = {
    exchange: string;
    tradeType: TradingType;
    statusUrl?: string;
};

const ProviderCardContent = ({ exchange, tradeType, statusUrl }: ProviderCardContentProps) => {
    const { translate } = useTranslate();
    const openLink = useOpenLink();

    const providerInfo = useSelector((state: TradingRootState) =>
        selectTradingProviderByNameAndTradeType(state, exchange, tradeType),
    );

    const { logo, companyName, supportUrl } = providerInfo ?? {};

    return (
        <>
            <TradeDetailInfoRow
                borderBottom
                title={translate('moduleTrading.tradingScreen.provider')}
                content={
                    <HStack>
                        {logo && <ProviderLogo logo={logo} />}
                        <Text
                            color="contentSecondary"
                            variant="body-sm"
                            accessibilityLabel={translate(
                                'moduleTrading.tradingScreen.selectedProvider',
                            )}
                        >
                            {companyName ?? exchange.toUpperCase()}
                        </Text>
                    </HStack>
                }
            />
            {statusUrl && (
                <TradeDetailInfoRow
                    borderBottom
                    onPress={() => openLink(statusUrl)}
                    title={
                        <Link
                            label={
                                <Translation id="moduleTrading.tradeHistory.detail.checkOrderStatus" />
                            }
                            isUnderlined
                            href={statusUrl}
                        />
                    }
                    content={<Icon color="contentBrand" name="arrowSquareOut" />}
                />
            )}
            {supportUrl && (
                <TradeDetailInfoRow
                    onPress={() => openLink(supportUrl)}
                    title={
                        <Link
                            label={
                                <Translation id="moduleTrading.tradeHistory.detail.providerSupport" />
                            }
                            isUnderlined
                            href={supportUrl}
                        />
                    }
                    content={<Icon color="contentBrand" name="arrowSquareOut" />}
                />
            )}
        </>
    );
};

export const TradeDetailProviderCard = ({ orderId }: TradeProviderCardProps) => {
    const trade = useSelector((state: TradingRootState) =>
        selectTradingTradeByOrderId(state, orderId),
    );

    if (!trade) {
        return null;
    }

    const {
        data: { statusUrl, exchange },
        tradeType,
    } = trade;

    return (
        <Card noPadding>
            <ProviderCardContent
                exchange={exchange ?? ''}
                tradeType={tradeType}
                statusUrl={statusUrl ?? ''}
            />
        </Card>
    );
};
