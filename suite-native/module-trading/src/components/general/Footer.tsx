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
import { Link } from '@suite-native/link';
import { selectIsAmountInputActive } from '@suite-native/trading-state';
import { TREZOR_SUITE_TOS_URL, TREZOR_TRADING_LEARN_MORE_URL } from '@trezor/urls';

export type FooterProps = {
    type?: TradingType;
    isFormMountedRecently?: boolean;
};

interface FooterProviderContentProps {
    provider: BuyProviderInfo | SellProviderInfo | ExchangeProviderInfo | undefined;
}

const FooterProviderContent = ({ provider }: FooterProviderContentProps) => {
    if (!provider || !provider.termsUrl) {
        return (
            <Text variant="hint" color="textSubdued" textAlign="center">
                <Translation id="moduleTrading.tradingScreen.footer.termsAndConditionsGeneral" />
            </Text>
        );
    }

    const { companyName, termsUrl } = provider;

    return (
        <Text variant="hint" color="textSubdued" textAlign="center">
            <Translation
                id="moduleTrading.tradingScreen.footer.termsAndConditionsProvider"
                values={{
                    companyName,
                    link: parts => (
                        <Link
                            textVariant="hint"
                            textColor="textSubdued"
                            textPressedColor="textDisabled"
                            href={termsUrl}
                            label={parts}
                            isUnderlined
                            key={parts.join('|')}
                        />
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

const ProviderContent = ({ type }: Pick<FooterProps, 'type'>) => {
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
};

export const Footer = ({ type, isFormMountedRecently }: FooterProps) => {
    const shouldHideFooter = useSelector(selectIsAmountInputActive);

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
                <ProviderContent type={type} />

                <HStack alignItems="center" spacing="sp4">
                    <Link
                        textVariant="hint"
                        textColor="textSubdued"
                        textPressedColor="textDisabled"
                        href={TREZOR_SUITE_TOS_URL}
                        label={<Translation id="moduleTrading.tradingScreen.footer.termsOfUse" />}
                    />

                    <Text variant="hint" color="textSubdued">
                        |
                    </Text>

                    <Link
                        textVariant="hint"
                        textColor="textSubdued"
                        textPressedColor="textDisabled"
                        href={TREZOR_TRADING_LEARN_MORE_URL}
                        label={<Translation id="moduleTrading.tradingScreen.footer.learnMore" />}
                    />
                </HStack>
            </VStack>
        </AnimatedBox>
    );
};
