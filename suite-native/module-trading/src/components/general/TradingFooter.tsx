import { useMemo } from 'react';
import { TouchableOpacity } from 'react-native';
import { AnimatedProps } from 'react-native-reanimated';

import { AnimatedBox, Button, HStack, Image, Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { useOpenLink } from '@suite-native/link';

export type TradingFooterProps = {
    enteringAnimation?: AnimatedProps<any>['entering'];
    exitingAnimation?: AnimatedProps<any>['exiting'];
};

export const TradingFooter = ({ enteringAnimation, exitingAnimation }: TradingFooterProps) => {
    const openLink = useOpenLink();

    const imageSource = useMemo(() => require('../../../assets/InvityLogo.png'), []);
    const openLinkToInvity = () => openLink('https://invity.io');

    return (
        <AnimatedBox entering={enteringAnimation} exiting={exitingAnimation}>
            <HStack justifyContent="space-between" alignItems="center">
                <HStack alignItems="center" spacing="sp4">
                    <Text variant="label" color="textSubdued">
                        <Translation id="moduleTrading.tradingScreen.footer.poweredBy" />
                    </Text>
                    <TouchableOpacity onPress={openLinkToInvity}>
                        <Image source={imageSource} contentFit="contain" width={44} height={18} />
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
