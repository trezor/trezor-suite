import { ReactNode } from 'react';

import { Icon, IconName } from '@suite-native/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { Box } from '../Box';
import { Card } from '../Card/Card';
import { InlineAlertBox, InlineAlertBoxProps } from '../InlineAlertBox/InlineAlertBox';
import { HStack, VStack } from '../Stack';
import { Text } from '../Text';

const contentStyle = prepareNativeStyle(() => ({
    flexGrow: 1,
    flexShrink: 1,
}));

type CardWithIconLayoutProps = {
    icon: IconName;
    title: ReactNode;
    children: ReactNode;
    alertBoxProps?: Omit<InlineAlertBoxProps, 'borderRadius'>;
};

export const CardWithIconLayout = ({
    icon,
    title,
    children,
    alertBoxProps,
}: CardWithIconLayoutProps) => {
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
