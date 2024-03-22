import { ReactNode } from 'react';

import { Icon, IconName } from '@suite-common/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Box, Text } from '@suite-native/atoms';

type AnalyticsInfoRowProps = {
    iconName: IconName;
    title: ReactNode;
    description: ReactNode;
};

const iconWrapper = prepareNativeStyle(utils => ({
    justifyContent: 'center',
    alignItems: 'center',
    width: 48,
    height: 48,
    backgroundColor: utils.colors.backgroundSurfaceElevation2,
    borderRadius: utils.borders.radii.round,
}));

const rowContentStyle = prepareNativeStyle(_ => ({
    marginLeft: 12,
    marginRight: 48,
}));

export const AnalyticsInfoRow = ({ iconName, title, description }: AnalyticsInfoRowProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Box flexDirection="row">
            <Box style={applyStyle(iconWrapper)}>
                <Icon name={iconName} />
            </Box>
            <Box style={applyStyle(rowContentStyle)}>
                <Text>{title}</Text>
                <Text variant="hint" color="textSubdued">
                    {description}
                </Text>
            </Box>
        </Box>
    );
};
