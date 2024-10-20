import { ReactNode } from 'react';

import { Icon, IconName } from '@suite-native/icons';
import { AlertBox, AlertBoxProps, Box, Card, HStack, Text, VStack } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

const contentStyle = prepareNativeStyle(() => ({
    flexGrow: 1,
    flexShrink: 1,
}));

export type DeviceSettingsCardProps = {
    icon: IconName;
    title: ReactNode;
    children: ReactNode;
    alertBoxProps?: Omit<AlertBoxProps, 'borderRadius'>;
};

export const DeviceSettingsCard = ({
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
                    <AlertBox {...alertBoxProps} borderRadius="r12" />
                </Box>
            )}
        </Card>
    );
};
