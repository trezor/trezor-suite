import {
    ContinueOnTrezorScreenContent,
    DeviceInteractionScreenWrapper,
} from '@suite-native/device';

import { useHandleNavigateToInitialScreenOnIdle } from '../hooks/useHandleNavigateToInitialScreenOnIdle';

export const ContinueOnTrezorScreen = () => {
    useHandleNavigateToInitialScreenOnIdle();

    return (
        <DeviceInteractionScreenWrapper>
            <ContinueOnTrezorScreenContent />
        </DeviceInteractionScreenWrapper>
    );
};
