// This is the Android implementation selected by Metro as the unsuffixed fallback.
import { Pressable } from 'react-native';

import * as Haptics from 'expo-haptics';

import type { ClipboardCopyMenuProps } from './ClipboardCopyMenu.types';
import { useCopyToClipboard } from '../hooks/useCopyToClipboard';

export const ClipboardCopyMenu = ({
    value,
    children,
    copyMessage,
    onCopy,
    style,
}: ClipboardCopyMenuProps) => {
    const copyToClipboard = useCopyToClipboard();

    const handleLongPress = () => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        if (onCopy) {
            void onCopy();

            return;
        }

        if (value !== undefined) {
            void copyToClipboard(value, copyMessage);
        }
    };

    return (
        <Pressable onLongPress={handleLongPress} style={style}>
            {children}
        </Pressable>
    );
};
