import type { ReactElement } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import type { ButtonProps } from '@expo/ui/swift-ui';

export type ContextMenuAction = {
    label: string;
    // SF Symbol name, shown on iOS only.
    systemImage?: ButtonProps['systemImage'];
    onPress: () => void | Promise<void>;
};

export type ContextMenuProps = {
    actions: ContextMenuAction[];
    children: ReactElement;
    style?: StyleProp<ViewStyle>;
};
