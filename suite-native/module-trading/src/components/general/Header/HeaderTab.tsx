import { ReactNode } from 'react';

import { Button } from '@suite-native/atoms';
import { IconName } from '@suite-native/icons';

type HeaderTabProps = {
    icon: IconName;
    children: ReactNode;
    active: boolean;
    onPress: () => void;
};

export const HeaderTab = ({ icon, children, onPress, active }: HeaderTabProps) => {
    const colorScheme = active ? 'tertiaryElevation0' : 'backgroundSurfaceElevation0';

    return (
        <Button
            viewLeft={icon}
            colorScheme={colorScheme}
            size="small"
            onPress={onPress}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
        >
            {children}
        </Button>
    );
};
