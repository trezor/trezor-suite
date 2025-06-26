import { useSelector } from 'react-redux';

import { selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { CompactCardWithIconLayout, CompactCardWithIconLayoutProps } from '@suite-native/atoms';

export const DeviceSettingsItemCard = ({
    icon,
    title,
    onPress,
    testID,
    subtitle,
}: CompactCardWithIconLayoutProps) => {
    const hasRunningDiscovery = useSelector(selectHasRunningDiscovery);

    return (
        <CompactCardWithIconLayout
            icon={icon}
            onPress={onPress}
            title={title}
            subtitle={subtitle}
            isDisabled={hasRunningDiscovery}
            testID={testID}
        />
    );
};
