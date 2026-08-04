import type { ReactElement } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import type { ButtonProps } from '@expo/ui/swift-ui';

export type ClipboardCopyMenuAction = {
    label: string;
    systemImage?: ButtonProps['systemImage'];
    onPress: () => void | Promise<void>;
};

export type ClipboardCopyMenuProps = {
    value?: string;
    children: ReactElement;
    copyMessage?: string;
    copyLabel?: string;
    menuActions?: ClipboardCopyMenuAction[];
    additionalActions?: ClipboardCopyMenuAction[];
    onCopy?: () => void | Promise<void>;
    style?: StyleProp<ViewStyle>;
};
