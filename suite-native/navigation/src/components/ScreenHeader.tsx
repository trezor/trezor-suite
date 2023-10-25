import { DeviceManager } from '@suite-native/device-switcher';
import { ScreenHeaderWrapper } from '@suite-native/atoms';

type ScreenHeaderProps = {
    hasBottomPadding?: boolean;
};

export const ScreenHeader = ({ hasBottomPadding }: ScreenHeaderProps) => (
    <ScreenHeaderWrapper marginBottom={hasBottomPadding ? 'small' : undefined}>
        <DeviceManager />
    </ScreenHeaderWrapper>
);
