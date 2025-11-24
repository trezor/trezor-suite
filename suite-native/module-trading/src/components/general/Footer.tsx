import { useCallback } from 'react';
import { FadeInDown, FadeOutDown, LinearTransition } from 'react-native-reanimated';
import { useSelector } from 'react-redux';

import type { BuyProviderInfo, ExchangeProviderInfo, SellProviderInfo } from 'invity-api';

import {
    TradingRootState,
    TradingType,
    selectTradingBuyInfo,
    selectTradingBuySelectedQuote,
    selectTradingExchangeInfo,
    selectTradingExchangeSelectedQuote,
    selectTradingSellInfo,
    selectTradingSellSelectedQuote,
} from '@suite-common/trading';
import { AnimatedBox, Divider, HStack, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { useOpenLink } from '@suite-native/link';
import { selectIsAmountInputActive } from '@suite-native/trading-state';
import { DATA_TOS_INVITY_URL, INVITY_URL } from '@trezor/urls';

interface FooterProviderContentProps {
    provider: BuyProviderInfo | SellProviderInfo | ExchangeProviderInfo | undefined;
}

const FooterProviderContent = ({ provider }: FooterProviderContentProps) => {
    const openLink = useOpenLink();

    return (
        <Text variant="hint" color="textSubdued" textAlign="center">
            <Translation
                id="moduleTrading.tradingScreen.footer.termsAndConditions"
                values={{
                    termsAndConditions:
                        provider && provider.termsUrl ? (
                            <Text
                                variant="hint"
                                color="textSubdued"
                                style={{ textDecorationLine: 'underline' }}
                                onPress={() => openLink(provider.termsUrl!)}
                            >
                                <Translation
                                    id="moduleTrading.tradingScreen.footer.providerTermsAndConditions"
                                    values={{ companyName: provider.companyName }}
                                />
                            </Text>
                        ) : (
                            <Translation id="moduleTrading.tradingScreen.footer.noProviderTermsAndConditions" />
                        ),
                }}
            />
        </Text>
    );
};

const BuyFooterProviderContent = () => {
    const quote = useSelector(selectTradingBuySelectedQuote);
    const providerInfos = useSelector(
        (state: TradingRootState) => selectTradingBuyInfo(state)?.providerInfos,
    );
    const provider = quote?.exchange ? providerInfos?.[quote?.exchange] : undefined;

    return <FooterProviderContent provider={provider} />;
};

const SellFooterProviderContent = () => {
    const quote = useSelector(selectTradingSellSelectedQuote);
    const providerInfos = useSelector(
        (state: TradingRootState) => selectTradingSellInfo(state)?.providerInfos,
    );
    const provider = quote?.exchange ? providerInfos?.[quote?.exchange] : undefined;

    return <FooterProviderContent provider={provider} />;
};

const ExchangeFooterProviderContent = () => {
    const quote = useSelector(selectTradingExchangeSelectedQuote);
    const providerInfos = useSelector(
        (state: TradingRootState) => selectTradingExchangeInfo(state)?.providerInfos,
    );
    const provider = quote?.exchange ? providerInfos?.[quote?.exchange] : undefined;

    return <FooterProviderContent provider={provider} />;
};

export type FooterProps = {
    type?: TradingType;
    isFormMountedRecently?: boolean;
};

export const Footer = ({ type, isFormMountedRecently }: FooterProps) => {
    const openLink = useOpenLink();
    const shouldHideFooter = useSelector(selectIsAmountInputActive);

    const ProviderContent = useCallback(() => {
        switch (type) {
            case 'buy':
                return <BuyFooterProviderContent />;
            case 'sell':
                return <SellFooterProviderContent />;
            case 'exchange':
                return <ExchangeFooterProviderContent />;
            default:
                return null;
        }
    }, [type]);

    if (shouldHideFooter) {
        return null;
    }

    return (
        <AnimatedBox
            entering={isFormMountedRecently ? undefined : FadeInDown}
            exiting={FadeOutDown}
            layout={isFormMountedRecently ? undefined : LinearTransition}
        >
            <Divider marginTop="sp16" marginBottom="sp16" />

            <VStack alignItems="center">
                <ProviderContent />

                <HStack alignItems="center" spacing="sp4">
                    <Text
                        variant="hint"
                        color="textSubdued"
                        onPress={() => openLink(DATA_TOS_INVITY_URL)}
                    >
                        <Translation id="moduleTrading.tradingScreen.footer.termsOfUse" />
                    </Text>

                    <Text variant="hint" color="textSubdued">
                        |
                    </Text>

                    <Text variant="hint" color="textSubdued" onPress={() => openLink(INVITY_URL)}>
                        <Translation id="moduleTrading.tradingScreen.footer.learnMore" />
                    </Text>
                </HStack>
            </VStack>
        </AnimatedBox>
    );
};
