import { ContinueOnTrezorScreenContent } from '@suite-native/device';
import { useInterceptNativeNavigation } from '@suite-native/navigation';

import { DeviceInteractionScreenWrapper } from '../components/DeviceInteractionScreenWrapper';

export const ContinueOnTrezorScreen = () => {
    useInterceptNativeNavigation();

    return (
        <DeviceInteractionScreenWrapper>
            <ContinueOnTrezorScreenContent />
        </DeviceInteractionScreenWrapper>
    );
};
