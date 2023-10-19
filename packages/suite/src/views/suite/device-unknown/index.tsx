// TODO: remove whole file, replaced by @suite-components/PrerequisitesGuide/components/DeviceUnknown

import { DeviceInvalidModeLayout, Translation } from 'src/components/suite';

export const DeviceUnknown = () => (
    <DeviceInvalidModeLayout title={<Translation id="TR_UNKNOWN_DEVICE" />} allowSwitchDevice />
);
