import { ReactNode } from 'react';

import {
    Box,
    Card,
    HStack,
    InlineAlertBox,
    InlineAlertBoxProps,
    Text,
    VStack,
} from '@suite-native/atoms';
import { Icon, IconName } from '@suite-native/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

const contentStyle = prepareNativeStyle(() => ({
    flexGrow: 1,
    flexShrink: 1,
}));

type DeviceSettingsCardProps = {
    icon: IconName;
    title: ReactNode;
    children: ReactNode;
    alertBoxProps?: Omit<InlineAlertBoxProps, 'borderRadius'>;
};

export const SettingsCardWithIconLayout = ({
    icon,
    title,
    children,
    alertBoxProps,
}: DeviceSettingsCardProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Card borderColor="borderElevation1" noPadding>
            <HStack margin="sp16" spacing="sp12">
                <Box marginVertical="sp2">
                    <Icon name={icon} size="mediumLarge" />
                </Box>
                <VStack spacing={0} style={applyStyle(contentStyle)}>
                    <Text variant="highlight">{title}</Text>
                    {children}
                </VStack>
            </HStack>
            {alertBoxProps && (
                <Box margin="sp4">
                    <InlineAlertBox {...alertBoxProps} />
                </Box>
            )}
        </Card>
    );
};
