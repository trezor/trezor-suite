import { ContinueOnTrezorScreenContent } from '@suite-native/device';
import { useHandleHardwareBackNavigation } from '@suite-native/navigation';
import TrezorConnect from '@trezor/connect';

import { DeviceInteractionScreenWrapper } from '../components/DeviceInteractionScreenWrapper';

export const WipeDeviceContinueOnTrezorScreen = () => {
    useHandleHardwareBackNavigation(() => TrezorConnect.cancel());

    return (
        <DeviceInteractionScreenWrapper>
            <ContinueOnTrezorScreenContent />
        </DeviceInteractionScreenWrapper>
    );
};
