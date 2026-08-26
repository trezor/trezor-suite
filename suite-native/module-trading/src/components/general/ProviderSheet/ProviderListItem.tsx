import { Pressable } from 'react-native';
import { useSelector } from 'react-redux';

import {
    type TradingProviderInfo,
    type TradingRootState,
    type TradingTradeType,
    type TradingType,
    selectTradingProviderByNameAndTradeType,
} from '@suite-common/trading';
import { Card, HStack, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { ProviderLogo } from '@suite-native/trading-atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { ProviderListItemAmount } from './ProviderListItemAmount';
import { ProviderListItemInfo } from './ProviderListItemInfo';

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

const companyNameStyle = prepareNativeStyle(() => ({
    flexShrink: 1,
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
    const isDex = 'kycPolicyType' in provider && provider.kycPolicyType === 'DEX';

    if (!orderId) {
        return null;
    }

    return (
        <Pressable onPress={() => onPress(quote)} style={applyStyle(wrapperStyle)}>
            <Card>
                <VStack>
                    <HStack
                        justifyContent="space-between"
                        alignItems="center"
                        paddingBottom="sp2"
                        spacing="sp4"
                    >
                        <HStack alignItems="center" flex={1} flexShrink={1} spacing="sp12">
                            <ProviderLogo logo={logo} size="headline-sm" />
                            <VStack spacing="sp2" flex={1} flexShrink={1}>
                                <Text
                                    variant="body-md"
                                    color="contentPrimary"
                                    numberOfLines={1}
                                    ellipsizeMode="tail"
                                    style={applyStyle(companyNameStyle)}
                                >
                                    {companyName}
                                </Text>
                                {shouldShowExchangeType && (
                                    <Text variant="body-sm" color="contentSecondary">
                                        {isDex ? (
                                            <Translation id="moduleTrading.providerListItem.decentralizedExchange" />
                                        ) : (
                                            <Translation id="moduleTrading.providerListItem.centralizedExchange" />
                                        )}
                                    </Text>
                                )}
                            </VStack>
                        </HStack>
                        <ProviderListItemAmount quote={quote} />
                    </HStack>
                    <ProviderListItemInfo provider={provider} quote={quote} />
                </VStack>
            </Card>
        </Pressable>
    );
};
