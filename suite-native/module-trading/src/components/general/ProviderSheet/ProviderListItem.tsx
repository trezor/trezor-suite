import { Pressable } from 'react-native';
import { useSelector } from 'react-redux';

import {
    type TradingProviderInfo,
    type TradingRootState,
    type TradingTradeType,
    type TradingType,
    selectTradingProviderByNameAndTradeType,
} from '@suite-common/trading';
import { Card, CardDivider, HStack, Text, VStack } from '@suite-native/atoms';
import { ProviderLogo } from '@suite-native/trading-atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { ProviderListItemInfo } from './ProviderListItemInfo';
import { ProviderListItemValueRow } from './ProviderListItemValueRow';

export type ProviderListItemProps<T extends TradingTradeType> = {
    isSelected: boolean;
    onPress: (quote: T) => void;
    quote: T;
    shouldShowExchangeType: boolean;
    tradingType: TradingType;
};

const wrapperStyle = prepareNativeStyle(({ spacings }) => ({
    marginVertical: spacings.sp4,
}));

export const ProviderListItem = <T extends TradingTradeType>({
    onPress,
    quote,
    shouldShowExchangeType,
    tradingType,
}: ProviderListItemProps<T>) => {
    const { applyStyle } = useNativeStyles();

    const provider =
        useSelector((state: TradingRootState) =>
            selectTradingProviderByNameAndTradeType(state, quote.exchange, tradingType),
        ) ?? ({ companyName: '', logo: '' } as TradingProviderInfo);

    const { orderId } = quote;
    const { companyName, logo } = provider;

    if (!orderId) {
        return null;
    }

    return (
        <Pressable onPress={() => onPress(quote)} style={applyStyle(wrapperStyle)}>
            <Card>
                <VStack>
                    <HStack alignItems="center" paddingBottom="sp2">
                        <ProviderLogo logo={logo} />
                        <Text variant="body-md" color="contentPrimary">
                            {companyName}
                        </Text>
                    </HStack>
                    <ProviderListItemInfo
                        provider={provider}
                        quote={quote}
                        shouldShowExchangeType={shouldShowExchangeType}
                    />
                    <CardDivider />
                    <ProviderListItemValueRow quote={quote} />
                </VStack>
            </Card>
        </Pressable>
    );
};
