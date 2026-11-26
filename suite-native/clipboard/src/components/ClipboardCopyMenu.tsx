import type { ReactElement } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import * as Haptics from 'expo-haptics';

import { ContextMenu } from '@suite-native/atoms';
import { useTranslate } from '@suite-native/intl';

import { useCopyToClipboard } from '../hooks/useCopyToClipboard';

export type ClipboardCopyMenuProps = {
    children: ReactElement;
    style?: StyleProp<ViewStyle>;
} & ({ value: string; onCopy?: never } | { onCopy: () => void | Promise<void>; value?: never });

export const ClipboardCopyMenu = ({ value, onCopy, children, style }: ClipboardCopyMenuProps) => {
    const copyToClipboard = useCopyToClipboard();
    const { translate } = useTranslate();

    const handleCopy = () => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        if (onCopy) {
            void onCopy();

            return;
        }

        if (value !== undefined) {
            void copyToClipboard(value);
        }
    };

    return (
        <ContextMenu
            actions={[
                {
                    label: translate('generic.buttons.copy'),
                    icon: 'copy',
                    onPress: handleCopy,
                },
            ]}
            style={style}
        >
            {children}
        </ContextMenu>
    );
};
