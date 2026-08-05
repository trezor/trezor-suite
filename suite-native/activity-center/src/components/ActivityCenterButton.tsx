import { useState } from 'react';

import { useNavigation } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AnimatedPressable, Box, useButtonPressAnimatedStyle } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import {
    ActivityCenterStackRoutes,
    type RootStackParamList,
    RootStackRoutes,
} from '@suite-native/navigation';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { NotificationDot } from './NotificationDot';

type ActivityCenterButtonProps = {
    hasUnseenNotifications?: boolean;
};

const BUTTON_SIZE = 56;

const buttonStyle = prepareNativeStyle(utils => ({
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    backgroundColor: utils.colors.surfaceFillAction,
    borderRadius: utils.borders.radii.r16,
    borderWidth: utils.borders.widths.small,
    borderColor: utils.colors.surfaceBorderAction,
    alignItems: 'center',
    justifyContent: 'center',
    ...utils.boxShadows.small,
}));

const dotWrapperStyle = prepareNativeStyle(() => ({
    position: 'absolute',
    top: 16,
    right: 17,
}));

export const ActivityCenterButton = ({
    hasUnseenNotifications = false,
}: ActivityCenterButtonProps) => {
    const [isPressed, setIsPressed] = useState(false);
    const { applyStyle } = useNativeStyles();
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    const animatedPressStyle = useButtonPressAnimatedStyle(
        isPressed,
        false,
        'surfaceFillAction',
        'surfaceFillActionPressed',
    );

    const handlePress = () =>
        navigation.navigate(RootStackRoutes.ActivityCenterStack, {
            screen: ActivityCenterStackRoutes.ActivityCenter,
        });

    return (
        <AnimatedPressable
            onPress={handlePress}
            onPressIn={() => setIsPressed(true)}
            onPressOut={() => setIsPressed(false)}
            style={[animatedPressStyle, applyStyle(buttonStyle)]}
        >
            <Icon name="bell" size="large" color="contentPrimary" />
            {hasUnseenNotifications && (
                <Box style={applyStyle(dotWrapperStyle)}>
                    <NotificationDot />
                </Box>
            )}
        </AnimatedPressable>
    );
};
