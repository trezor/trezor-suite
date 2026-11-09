import { useSelector } from 'react-redux';

import { selectHasRunningDiscovery } from '@suite-common/wallet-core';
import {
    CompactCardWithIconLayout,
    type CompactCardWithIconLayoutProps,
} from '@suite-native/atoms';

export const DeviceSettingsItemCard = ({
    icon,
    title,
    onPress,
    variant,
    alertBoxProps,
    testID,
    subtitle,
}: CompactCardWithIconLayoutProps) => {
    const hasRunningDiscovery = useSelector(selectHasRunningDiscovery);

    return (
        <CompactCardWithIconLayout
            alertBoxProps={alertBoxProps}
            icon={icon}
            onPress={onPress}
            title={title}
            variant={variant}
            subtitle={subtitle}
            isDisabled={hasRunningDiscovery}
            testID={testID}
        />
    );
};
