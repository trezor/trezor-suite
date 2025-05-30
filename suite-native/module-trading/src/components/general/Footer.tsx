import { useMemo } from 'react';
import { TouchableOpacity } from 'react-native';
import { FadeInDown, FadeOutDown, LinearTransition } from 'react-native-reanimated';
import { useSelector } from 'react-redux';

import { AnimatedBox, Button, HStack, Image, Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { useOpenLink } from '@suite-native/link';

import { selectIsAmountInputActive } from '../../selectors/commonSelectors';

export type FooterProps = {
    isFormMountedRecently?: boolean;
};

export const Footer = ({ isFormMountedRecently }: FooterProps) => {
    const openLink = useOpenLink();
    const shouldHideFooter = useSelector(selectIsAmountInputActive);

    const imageSource = useMemo(() => require('../../../assets/InvityLogo.png'), []);
    const openLinkToInvity = () => openLink('https://invity.io');

    if (shouldHideFooter) {
        return null;
    }

    return (
        <AnimatedBox
            entering={isFormMountedRecently ? undefined : FadeInDown}
            exiting={FadeOutDown}
            layout={isFormMountedRecently ? undefined : LinearTransition}
        >
            <HStack justifyContent="space-between" alignItems="center">
                <HStack alignItems="center" spacing="sp4">
                    <Text variant="label" color="textSubdued">
                        <Translation id="moduleTrading.tradingScreen.footer.poweredBy" />
                    </Text>
                    <TouchableOpacity onPress={openLinkToInvity}>
                        <Image
                            source={imageSource}
                            contentFit="contain"
                            width={44}
                            height={18}
                            accessibilityLabel="Invity"
                        />
                    </TouchableOpacity>
                </HStack>
                <Button
                    colorScheme="tertiaryElevation0"
                    size="tiny"
                    onPress={openLinkToInvity}
                    viewRight="arrowUpRight"
                >
                    <Translation id="moduleTrading.tradingScreen.footer.learnMore" />
                </Button>
            </HStack>
        </AnimatedBox>
    );
};
