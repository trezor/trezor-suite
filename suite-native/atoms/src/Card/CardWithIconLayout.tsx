import { type ReactNode } from 'react';

import { Icon, type IconName } from '@suite-native/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { Box } from '../Box';
import { Card } from '../Card/Card';
import { InlineAlertBox, type InlineAlertBoxProps } from '../InlineAlertBox/InlineAlertBox';
import { HStack, VStack } from '../Stack';
import { Text } from '../Text';

const contentStyle = prepareNativeStyle(() => ({
    flexGrow: 1,
    flexShrink: 1,
}));

export type CardWithIconLayoutProps = {
    icon: IconName;
    title: ReactNode;
    children: ReactNode;
    alertBoxProps?: Omit<InlineAlertBoxProps, 'borderRadius'>;
    testID?: string;
};

export const CardWithIconLayout = ({
    icon,
    title,
    children,
    alertBoxProps,
    testID,
}: CardWithIconLayoutProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Card borderColor="borderNeutral" noPadding testID={testID}>
            <HStack margin="sp16" spacing="sp12">
                <Box marginVertical="sp2">
                    <Icon name={icon} size="mediumLarge" />
                </Box>
                <VStack spacing={0} style={applyStyle(contentStyle)}>
                    <Text variant="body-md-strong">{title}</Text>
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
