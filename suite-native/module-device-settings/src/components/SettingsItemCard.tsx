import { ReactNode } from 'react';
import { Pressable } from 'react-native';

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

const ICON_WRAPPER_SIZE = 48;

type SettingsItemCardProps = {
    icon: IconName;
    title: ReactNode;
    subtitle: ReactNode;
    alertBoxProps?: Omit<InlineAlertBoxProps, 'borderRadius'>;
    onPress: () => void;
};

const contentStyle = prepareNativeStyle(() => ({
    flexGrow: 1,
    flexShrink: 1,
}));

const iconWrapperStyle = prepareNativeStyle(utils => ({
    alignItems: 'center',
    justifyContent: 'center',
    width: ICON_WRAPPER_SIZE,
    height: ICON_WRAPPER_SIZE,
    backgroundColor: utils.colors.backgroundTertiaryDefaultOnElevation1,
    borderRadius: utils.borders.radii.round,
}));

export const SettingsItemCard = ({
    icon,
    title,
    alertBoxProps,
    onPress,
}: SettingsItemCardProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Pressable onPress={onPress}>
            <Card borderColor="borderElevation1" noPadding>
                <HStack padding="sp16" spacing="sp12" alignItems="center">
                    <Box marginVertical="sp2" style={applyStyle(iconWrapperStyle)}>
                        <Icon name={icon} size="large" color="iconSubdued" />
                    </Box>
                    <HStack flex={1}>
                        <VStack spacing={0} style={applyStyle(contentStyle)}>
                            <Text>{title}</Text>
                            <Text color="textSubdued" variant="hint">
                                Description
                            </Text>
                        </VStack>
                    </HStack>
                    <Icon name="caretRight" />
                </HStack>
                {alertBoxProps && (
                    <Box margin="sp4">
                        <InlineAlertBox {...alertBoxProps} />
                    </Box>
                )}
            </Card>
        </Pressable>
    );
};
