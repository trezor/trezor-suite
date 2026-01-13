import { FadeInDown, FadeOutDown, LinearTransition } from 'react-native-reanimated';
import { useSelector } from 'react-redux';

import type { ProviderMetadata } from 'invity-api';

import { AnimatedBox, Divider, HStack, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { Link } from '@suite-native/link';
import {
    selectIsAmountInputActive,
    selectTradingProviderMetadata,
} from '@suite-native/trading-state';
import { TREZOR_SUITE_TOS_URL, TREZOR_TRADING_LEARN_MORE_URL } from '@trezor/urls';

export type FooterProps = {
    isFormMountedRecently?: boolean;
};

interface FooterProviderContentProps {
    provider: ProviderMetadata | undefined;
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

export const Footer = ({ isFormMountedRecently }: FooterProps) => {
    const shouldHideFooter = useSelector(selectIsAmountInputActive);
    const providerInfo = useSelector(selectTradingProviderMetadata);

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
                <FooterProviderContent provider={providerInfo} />

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
