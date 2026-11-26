import type { ReactElement } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

export type ContextMenuIcon = 'share' | 'download' | 'qrCode' | 'copy';

export type ContextMenuAction = {
    label: string;
    icon?: ContextMenuIcon;
    onPress: () => void | Promise<void>;
};

export type ContextMenuProps = {
    actions: ContextMenuAction[];
    children: ReactElement;
    style?: StyleProp<ViewStyle>;
};
