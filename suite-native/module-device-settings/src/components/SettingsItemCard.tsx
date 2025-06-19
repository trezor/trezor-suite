import { ReactNode } from 'react';
import { ActivityIndicator, Pressable } from 'react-native';
import { useSelector } from 'react-redux';

import { selectHasRunningDiscovery } from '@suite-common/wallet-core';
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

type CardVariant = 'normal' | 'danger';
type SettingsItemCardProps = {
    icon: IconName;
    title: ReactNode;
    subtitle: ReactNode;
    alertBoxProps?: Omit<InlineAlertBoxProps, 'borderRadius'>;
    onPress: () => void;
    variant: CardVariant;
};

const contentStyle = prepareNativeStyle(() => ({
    flexGrow: 1,
    flexShrink: 1,
}));

const iconWrapperStyle = prepareNativeStyle<{ variant: CardVariant }>((utils, { variant }) => ({
    alignItems: 'center',
    justifyContent: 'center',
    width: ICON_WRAPPER_SIZE,
    height: ICON_WRAPPER_SIZE,
    backgroundColor: utils.colors.backgroundTertiaryDefaultOnElevation1,
    borderRadius: utils.borders.radii.round,
    extend: {
        condition: variant === 'danger',
        style: {
            backgroundColor: utils.colors.backgroundAlertRedSubtleOnElevation1,
        },
    },
}));

export const SettingsItemCard = ({
    icon,
    title,
    subtitle,
    alertBoxProps,
    onPress,
    variant = 'normal',
}: SettingsItemCardProps) => {
    const { applyStyle } = useNativeStyles();
    const isDiscoveryRunning = useSelector(selectHasRunningDiscovery);

    return (
        <Pressable onPress={onPress} disabled={isDiscoveryRunning}>
            <Card borderColor="borderElevation1" noPadding>
                <HStack padding="sp16" spacing="sp12" alignItems="center">
                    <Box marginVertical="sp2" style={applyStyle(iconWrapperStyle, { variant })}>
                        <Icon
                            name={icon}
                            size="large"
                            color={variant === 'danger' ? 'iconAlertRed' : 'iconSubdued'}
                        />
                    </Box>
                    <HStack flex={1}>
                        <VStack spacing={0} style={applyStyle(contentStyle)}>
                            <Text color={variant === 'danger' ? 'textAlertRed' : 'textDefault'}>
                                {title}
                            </Text>
                            <Text
                                color={variant === 'danger' ? 'textAlertRed' : 'textSubdued'}
                                variant="hint"
                            >
                                {subtitle}
                            </Text>
                        </VStack>
                    </HStack>
                    {isDiscoveryRunning ? <ActivityIndicator /> : <Icon name="caretRight" />}
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
