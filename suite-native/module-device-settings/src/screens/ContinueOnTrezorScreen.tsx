import { ContinueOnTrezorScreenContent } from '@suite-native/device';

import { DeviceInteractionScreenWrapper } from '../components/DeviceInteractionScreenWrapper';

export const ContinueOnTrezorScreen = () => (
    <DeviceInteractionScreenWrapper>
        <ContinueOnTrezorScreenContent />
    </DeviceInteractionScreenWrapper>
);
