import { ScreenHeader } from '@suite-native/navigation';

import { DeviceManager } from './DeviceManager';

type DeviceManagerScreenHeaderProps = {
    hasBottomPadding?: boolean;
};

export const DeviceManagerScreenHeader = ({ hasBottomPadding }: DeviceManagerScreenHeaderProps) => (
    <ScreenHeader hasBottomPadding={hasBottomPadding}>
        <DeviceManager />
    </ScreenHeader>
);
