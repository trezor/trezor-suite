import { type ReactNode } from 'react';

import { Button } from '@suite-native/atoms';
import { type IconName } from '@suite-native/icons';

type HeaderTabProps = {
    icon: IconName;
    children: ReactNode;
    active: boolean;
    onPress: () => void;
    testID?: string;
};

export const HeaderTab = ({ icon, children, onPress, active, testID }: HeaderTabProps) => (
    <Button
        iconLeft={icon}
        intent="neutral"
        priority={active ? 'primary' : 'secondary'}
        size="small"
        onPress={onPress}
        accessibilityRole="tab"
        accessibilityState={{ selected: active }}
        testID={testID}
    >
        {children}
    </Button>
);
