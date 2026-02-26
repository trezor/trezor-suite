import { Pressable } from 'react-native';
import { useSelector } from 'react-redux';

import {
    type TradingProviderInfo,
    type TradingRootState,
    type TradingTradeType,
    type TradingType,
    selectTradingProviderByNameAndTradeType,
} from '@suite-common/trading';
import { Card, CardDivider, HStack, Radio, Text, VStack } from '@suite-native/atoms';
import { ProviderLogo } from '@suite-native/trading-atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { ProviderListItemInfo } from './ProviderListItemInfo';
import { ProviderListItemValueRow } from './ProviderListItemValueRow';

export type ProviderListItemProps<T extends TradingTradeType> = {
    isSelected: boolean;
    onPress: (quote: T) => void;
    quote: T;
    tradingType: TradingType;
};

const wrapperStyle = prepareNativeStyle(({ spacings }) => ({
    marginVertical: spacings.sp4,
}));

export const ProviderListItem = <T extends TradingTradeType>({
    isSelected,
    onPress,
    quote,
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
                    <HStack alignItems="center" justifyContent="space-between" paddingBottom="sp2">
                        <HStack>
                            <ProviderLogo logo={logo} />
                            <Text variant="body-md" color="textDefault">
                                {companyName}
                            </Text>
                        </HStack>
                        <Radio
                            value={orderId}
                            onPress={() => onPress(quote)}
                            isChecked={isSelected}
                        />
                    </HStack>
                    <ProviderListItemInfo provider={provider} quote={quote} />
                    <CardDivider />
                    <ProviderListItemValueRow quote={quote} />
                </VStack>
            </Card>
        </Pressable>
    );
};
