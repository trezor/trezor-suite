import { useMemo } from 'react';
import { TouchableOpacity } from 'react-native';

import { Button, HStack, Image, Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { useOpenLink } from '@suite-native/link';

export const TradingFooter = () => {
    const openLink = useOpenLink();

    const imageSource = useMemo(() => require('../../../assets/InvityLogo.png'), []);
    const openLinkToInvity = () => openLink('https://invity.io');

    return (
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
    );
};
