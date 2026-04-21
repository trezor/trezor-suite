import { FadeInDown, FadeOutDown, LinearTransition } from 'react-native-reanimated';
import { useSelector } from 'react-redux';

import type { ProviderMetadata } from 'invity-api';

import { selectTradingProviderMetadata } from '@suite-common/trading';
import { AnimatedBox, Divider, Text, VStack, useBottomSheetModal } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { Link } from '@suite-native/link';
import { selectIsAmountInputActive } from '@suite-native/trading-state';

import { HowTradingWorksSheet } from './HowTradingWorksSheet';

export type FooterProps = {
    isFormMountedRecently?: boolean;
};

interface FooterProviderContentProps {
    provider: ProviderMetadata | undefined;
}

const FooterProviderContent = ({ provider }: FooterProviderContentProps) => {
    if (!provider || !provider.termsUrl) {
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

export const Footer = ({ isFormMountedRecently }: FooterProps) => {
    const { bottomSheetRef, openModal, closeModal } = useBottomSheetModal();

    const shouldHideFooter = useSelector(selectIsAmountInputActive);
    const providerInfo = useSelector(selectTradingProviderMetadata);

    if (shouldHideFooter) {
        return null;
    }

    return (
        <>
            <AnimatedBox
                entering={isFormMountedRecently ? undefined : FadeInDown}
                exiting={FadeOutDown}
                layout={isFormMountedRecently ? undefined : LinearTransition}
            >
                <Divider marginTop="sp16" marginBottom="sp16" />

                <VStack alignItems="center">
                    <FooterProviderContent provider={providerInfo} />

                    <Link
                        label={
                            <Translation id="moduleTrading.tradingScreen.footer.howTradingWorksSheet.title" />
                        }
                        onPress={openModal}
                        textVariant="body-sm"
                        textColor="contentSecondary"
                        textPressedColor="contentDisabled"
                        isUnderlined
                    />
                </VStack>
            </AnimatedBox>
            <HowTradingWorksSheet ref={bottomSheetRef} closeModal={closeModal} />
        </>
    );
};
