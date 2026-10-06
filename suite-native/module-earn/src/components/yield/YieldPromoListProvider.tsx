import { HStack, Image, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { useNativeStyles } from '@trezor/styles-native';

const MORPHO_LOGO_SOURCE = require('../../assets/morpho-logo.svg');

export const YieldPromoListProvider = () => {
    const { utils } = useNativeStyles();

    return (
        <VStack alignItems="center" marginBottom="sp24">
            <HStack alignItems="center" spacing="sp8">
                <Text color="contentSecondary">
                    <Translation id="earn.poweredBy" />
                </Text>

                <Image
                    source={MORPHO_LOGO_SOURCE}
                    width={99}
                    height={20}
                    contentFit="contain"
                    tintColor={utils.colors.contentPrimary}
                />
            </HStack>
        </VStack>
    );
};
