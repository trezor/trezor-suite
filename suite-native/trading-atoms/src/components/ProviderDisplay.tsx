import { type ComponentProps } from 'react';

import { Box, HStack, Text, type TextProps } from '@suite-native/atoms';
import { type NativeSpacing } from '@trezor/theme';

import { ProviderLogo, type TradingProviderLogoProps } from './ProviderLogo';

export type ProviderDisplayProps = {
    accessibilityLabel?: string;
    color?: TextProps['color'];
    flex?: ComponentProps<typeof HStack>['flex'];
    justifyContent?: ComponentProps<typeof HStack>['justifyContent'];
    logo?: string;
    logoSize?: TradingProviderLogoProps['size'];
    providerName: string;
    spacing?: NativeSpacing | number;
    testID?: string;
    textVariant?: TextProps['variant'];
};

export const ProviderDisplay = ({
    accessibilityLabel,
    color = 'contentPrimary',
    flex,
    justifyContent = 'flex-end',
    logo,
    logoSize = 'body-sm',
    providerName,
    spacing = 'sp8',
    testID,
    textVariant = 'body-sm',
}: ProviderDisplayProps) => (
    <HStack
        alignItems="center"
        flex={flex}
        flexShrink={1}
        justifyContent={justifyContent}
        spacing={spacing}
    >
        {!!logo && <ProviderLogo logo={logo} size={logoSize} />}
        <Box flexShrink={1}>
            <Text
                accessibilityLabel={accessibilityLabel}
                color={color}
                ellipsizeMode="tail"
                numberOfLines={1}
                testID={testID}
                variant={textVariant}
            >
                {providerName}
            </Text>
        </Box>
    </HStack>
);
