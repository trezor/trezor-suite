import { Button, Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

type DeviceButtonState = 'open' | 'closed';

type DevicesToggleButtonProps = {
    deviceButtonState: DeviceButtonState;
    onDeviceButtonTap: () => void;
};

export const DevicesToggleButton = ({
    deviceButtonState = 'closed',
    onDeviceButtonTap,
}: DevicesToggleButtonProps) => (
    <Button
        size="small"
        colorScheme="tertiaryElevation0"
        viewRight={deviceButtonState === 'open' ? 'chevronUp' : 'chevronDown'}
        onPress={onDeviceButtonTap}
        testID="@device-manager/devices/toggle"
    >
        <Text variant="hint">
            <Translation id="deviceManager.deviceButtons.devices" />
        </Text>
    </Button>
);
