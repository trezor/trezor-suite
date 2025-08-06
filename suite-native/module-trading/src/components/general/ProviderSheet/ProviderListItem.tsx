import { Pressable } from 'react-native';
import { useSelector } from 'react-redux';

import {
    TradingProviderInfo,
    TradingRootState,
    TradingTradeType,
    TradingType,
    isBuyTrade,
    selectTradingProviderByNameAndTradeType,
} from '@suite-common/trading';
import { Card, HStack, Radio, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { ProviderLogo } from '../ProviderLogo';
import { InfoLineItem } from './InfoLineItem';
import { useChangeStringsExtractor } from '../../../hooks/history/useChangeStringsExtractor';
import { getKycPolicyWarningTranslation } from '../../../utils/general/kycUtils';

export type ProviderListItemProps<T extends TradingTradeType> = {
    isSelected: boolean;
    onPress: (quote: T) => void;
    quote: T;
    tradingType: TradingType;
};

export const PROVIDER_LIST_ITEM_ESTIMATED_HEIGHT = 160 as const;

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

    const { toStringValue, formattedRate } = useChangeStringsExtractor(quote);

    const provider =
        useSelector((state: TradingRootState) =>
            selectTradingProviderByNameAndTradeType(state, quote.exchange, tradingType),
        ) ?? ({ companyName: '', logo: '' } as TradingProviderInfo);

    const { orderId } = quote;
    const { companyName, logo } = provider;

    if (!orderId) {
        return null;
    }

    let isDex = false;
    let isAnonymous = false;
    let kycWarning;

    if ('kycPolicyType' in provider) {
        const kycPolicy = provider.kycPolicyType;

        isDex = kycPolicy === 'DEX';

        isAnonymous = kycPolicy === 'noKYC' || isDex;
        kycWarning = getKycPolicyWarningTranslation(kycPolicy);
    } else if (isBuyTrade(quote)) {
        kycWarning = <Translation id="moduleTrading.providerListItem.kycRequired" />;
    }

    return (
        <Pressable onPress={() => onPress(quote)} style={applyStyle(wrapperStyle)}>
            <Card>
                <VStack>
                    <HStack alignItems="center" justifyContent="space-between" paddingBottom="sp2">
                        <HStack>
                            <ProviderLogo logo={logo} />
                            <Text variant="body" color="textDefault">
                                {companyName}
                            </Text>
                        </HStack>
                        <Radio
                            value={orderId}
                            onPress={() => onPress(quote)}
                            isChecked={isSelected}
                        />
                    </HStack>
                    {!!formattedRate && (
                        <InfoLineItem
                            iconName="check"
                            text={<Translation id="moduleTrading.providerListItem.rate" />}
                            textRight={formattedRate}
                        />
                    )}
                    {!!toStringValue && (
                        <InfoLineItem
                            iconName="check"
                            text={<Translation id="moduleTrading.providerListItem.youGet" />}
                            iconColor="textSubdued"
                            textRight={toStringValue}
                        />
                    )}

                    <InfoLineItem
                        iconName="check"
                        text={
                            isDex ? (
                                <Translation id="moduleTrading.providerListItem.decentralizedExchange" />
                            ) : (
                                <Translation id="moduleTrading.providerListItem.centralizedExchange" />
                            )
                        }
                    />

                    {isAnonymous && (
                        <InfoLineItem
                            iconName="info"
                            text={<Translation id="moduleTrading.providerListItem.anonymous" />}
                            iconColor="baseContentBrand"
                            textColor="baseContentBrand"
                        />
                    )}
                    {kycWarning && (
                        <InfoLineItem
                            iconName="warning"
                            text={kycWarning}
                            iconColor="iconAlertRed"
                            textColor="textAlertRed"
                        />
                    )}
                </VStack>
            </Card>
        </Pressable>
    );
};
