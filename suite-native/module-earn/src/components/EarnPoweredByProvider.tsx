import React from 'react';

import { Box, HStack, Image, Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { useNativeStyles } from '@trezor/styles-native';

import { type EarnProvider } from '../types';

const EVERSTAKE_LOGO_SOURCE = require('../assets/everstake-logo.svg');
const MORPHO_LOGO_SOURCE = require('../assets/morpho-logo.svg');

const providerLogoMap = {
    everstake: {
        source: EVERSTAKE_LOGO_SOURCE,
        width: 114,
        height: 20,
    },
    morpho: {
        source: MORPHO_LOGO_SOURCE,
        width: 99,
        height: 20,
    },
} as const satisfies Record<EarnProvider, { source: number; width: number; height: number }>;

type ProviderLogoProps = {
    provider: EarnProvider;
};

const ProviderLogo = ({ provider }: ProviderLogoProps) => {
    const {
        utils: { colors },
    } = useNativeStyles();
    const { source, width, height } = providerLogoMap[provider];

    return (
        <Image
            source={source}
            width={width}
            height={height}
            contentFit="contain"
            tintColor={colors.contentPrimary}
        />
    );
};

type EarnPoweredByProviderProps = {
    provider: EarnProvider;
};

export const EarnPoweredByProvider = React.memo(({ provider }: EarnPoweredByProviderProps) => (
    <Box alignItems="center" marginBottom="sp24">
        <HStack alignItems="center" spacing="sp8">
            <Text color="contentSecondary">
                <Translation id="earn.poweredBy" />
            </Text>
            <ProviderLogo provider={provider} />
        </HStack>
    </Box>
));
