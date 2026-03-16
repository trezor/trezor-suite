import { Button, Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

type DevicesToggleButtonProps = {
    isOpened: boolean;
    onDeviceButtonTap: () => void;
};

export const DevicesToggleButton = ({ isOpened, onDeviceButtonTap }: DevicesToggleButtonProps) => (
    <Button
        size="small"
        intent="neutral"
        priority="secondary"
        iconRight={isOpened ? 'caretUp' : 'caretDown'}
        onPress={onDeviceButtonTap}
        testID="@device-manager/devices/toggle"
    >
        <Text variant="body-sm">
            <Translation id="deviceManager.deviceButtons.devices" />
        </Text>
    </Button>
);
