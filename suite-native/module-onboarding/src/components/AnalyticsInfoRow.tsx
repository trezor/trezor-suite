import { ReactNode } from 'react';

import { Icon, IconName } from '@suite-native/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Box, HStack, Text, VStack } from '@suite-native/atoms';

type AnalyticsInfoRowProps = {
    iconName: IconName;
    title: ReactNode;
    description: ReactNode;
};

const WRAPPER_SIZE = 36;

const iconWrapper = prepareNativeStyle(utils => ({
    justifyContent: 'center',
    alignItems: 'center',
    width: WRAPPER_SIZE,
    height: WRAPPER_SIZE,
    backgroundColor: utils.colors.backgroundSurfaceElevation2,
    borderRadius: utils.borders.radii.r12,
    borderWidth: 1,
    borderColor: utils.colors.backgroundTertiaryDefaultOnElevation0,
}));

export const AnalyticsInfoRow = ({ iconName, title, description }: AnalyticsInfoRowProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <HStack spacing="sp12" flexDirection="row" alignItems="center">
            <Box style={applyStyle(iconWrapper)}>
                <Icon name={iconName} size="mediumLarge" />
            </Box>
            <VStack spacing="sp4" flex={1}>
                <Text variant="highlight">{title}</Text>
                <Text variant="hint" color="textSubdued">
                    {description}
                </Text>
            </VStack>
        </HStack>
    );
};
