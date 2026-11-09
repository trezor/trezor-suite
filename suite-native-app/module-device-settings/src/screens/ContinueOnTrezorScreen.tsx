import {
    ContinueOnTrezorScreenContent,
    DeviceInteractionScreenWrapper,
} from '@suite-native/device';
import { useInterceptNativeNavigation } from '@suite-native/navigation';

export const ContinueOnTrezorScreen = () => {
    useInterceptNativeNavigation();

    return (
        <DeviceInteractionScreenWrapper>
            <ContinueOnTrezorScreenContent />
        </DeviceInteractionScreenWrapper>
    );
};
