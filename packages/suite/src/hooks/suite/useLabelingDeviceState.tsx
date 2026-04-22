import { useDevice } from '@suite/device';
import { isDevicePerceivedAsNew } from '@suite-common/suite-utils';

export const useLabelingDeviceState = () => {
    const { device, isLocked } = useDevice();

    // This should ideally not depend on the device so it should never be disabled.
    // But if user have REMEMBERED device DISCONNECTED, he would get to the wrong state where
    // Labeling is turned on in Settings, but not accessible at all and user is not informed
    // what to do to enable it. That is why it's disabled for now in that case.
    //
    // Following use cases need some bigger UX refactoring:
    // - Labeling enabled without any device connected
    // - Labeling enabled with the device connected inside Settings
    // The initialization of Labeling then start when user select a Wallet.

    const newlyConnectedDevice = isDevicePerceivedAsNew(device);

    const isDeviceLabelingDisabled =
        isLocked() ||
        device?.mode !== 'normal' ||
        !device?.state?.staticSessionId ||
        newlyConnectedDevice;

    return { isDeviceLabelingDisabled, newlyConnectedDevice };
};
