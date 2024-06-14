import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

import { Button, ButtonIcon, Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

type DevicesToggleButtonProps = {
    isOpened: boolean;
    onDeviceButtonTap: () => void;
};

const CHEVRON_ANIMATION_DURATION = 300;

export const DevicesToggleButton = ({ isOpened, onDeviceButtonTap }: DevicesToggleButtonProps) => {
    const animatedChevronStyle = useAnimatedStyle(() => ({
        transform: [
            {
                rotate: withTiming(`${isOpened ? -180 : 0}deg`, {
                    duration: CHEVRON_ANIMATION_DURATION,
                }),
            },
        ],
    }));

    return (
        <Button
            size="small"
            colorScheme="tertiaryElevation0"
            viewRight={
                <Animated.View style={animatedChevronStyle}>
                    <ButtonIcon iconName="chevronDown" />
                </Animated.View>
            }
            onPress={onDeviceButtonTap}
            testID="@device-manager/devices/toggle"
        >
            <Text variant="hint">
                <Translation id="deviceManager.deviceButtons.devices" />
            </Text>
        </Button>
    );
};
