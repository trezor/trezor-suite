import { FadeInDown } from 'react-native-reanimated';
import { useSelector } from 'react-redux';

import type { ProviderMetadata } from 'invity-api';

import { selectTradingProviderMetadata } from '@suite-common/trading';
import { AnimatedBox, Text, VStack, useBottomSheetModal } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { Link } from '@suite-native/link';
import { selectIsAmountInputActive } from '@suite-native/trading-state';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { HowTradingWorksSheet } from './HowTradingWorksSheet';

interface FooterProviderContentProps {
    provider: ProviderMetadata | undefined;
}

const FooterProviderContent = ({ provider }: FooterProviderContentProps) => {
    if (!provider?.termsUrl) {
        return (
            <Text variant="body-sm" color="contentSecondary" textAlign="center">
                <Translation id="moduleTrading.tradingScreen.footer.termsAndConditionsGeneric" />
            </Text>
        );
    }

    const { companyName, termsUrl } = provider;

    return (
        <Text variant="body-sm" color="contentSecondary" textAlign="center">
            <Translation
                id="moduleTrading.tradingScreen.footer.termsOfProvider"
                values={{
                    companyName,
                    link: parts => (
                        <Link
                            textVariant="body-sm"
                            textColor="contentSecondary"
                            textPressedColor="contentDisabled"
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

const linkStyle = prepareNativeStyle(({ spacings }) => ({
    paddingVertical: spacings.sp10,
}));

const stackStyle = prepareNativeStyle(() => ({
    marginTop: 'auto',
}));

export const Footer = () => {
    const { applyStyle } = useNativeStyles();
    const { bottomSheetRef, openModal, closeModal } = useBottomSheetModal({ isNestedSheet: true });

    const shouldHideFooter = useSelector(selectIsAmountInputActive);
    const providerInfo = useSelector(selectTradingProviderMetadata);

    if (shouldHideFooter) {
        return null;
    }

    return (
        <VStack style={applyStyle(stackStyle)}>
            <AnimatedBox entering={FadeInDown}>
                <VStack alignItems="center" paddingBottom="sp12">
                    <FooterProviderContent provider={providerInfo} />
                    <Link
                        label={
                            <Translation id="moduleTrading.tradingScreen.footer.howTradingWorksSheet.title" />
                        }
                        textVariant="body-sm"
                        textColor="contentSecondary"
                        textPressedColor="contentDisabled"
                        isUnderlined
                        onPress={openModal}
                        style={applyStyle(linkStyle)}
                    />
                </VStack>
            </AnimatedBox>
            <HowTradingWorksSheet ref={bottomSheetRef} closeModal={closeModal} />
        </VStack>
    );
};
