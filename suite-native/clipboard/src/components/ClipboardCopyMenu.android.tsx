import { useState } from 'react';
import { Pressable } from 'react-native';

import { DropdownMenu, DropdownMenuItem, Host, RNHostView, Text } from '@expo/ui/jetpack-compose';
import * as Haptics from 'expo-haptics';

import { useTranslate } from '@suite-native/intl';

import type { ClipboardCopyMenuProps } from './ClipboardCopyMenu.types';
import { useCopyToClipboard } from '../hooks/useCopyToClipboard';

export const ClipboardCopyMenu = ({
    value,
    children,
    copyMessage,
    copyLabel,
    menuActions,
    additionalActions,
    onCopy,
    style,
}: ClipboardCopyMenuProps) => {
    const copyToClipboard = useCopyToClipboard();
    const { translate } = useTranslate();
    const [isMenuExpanded, setIsMenuExpanded] = useState(false);

    const handleCopy = () => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        if (onCopy) {
            void onCopy();

            return;
        }

        if (value !== undefined) {
            void copyToClipboard(value, copyMessage);
        }
    };

    const actions = menuActions ?? [
        {
            label: copyLabel ?? translate('generic.buttons.copy'),
            onPress: handleCopy,
        },
        ...(additionalActions ?? []),
    ];

    const handleLongPress = () => {
        setIsMenuExpanded(true);
    };

    const handleDismissMenu = () => {
        setIsMenuExpanded(false);
    };

    return (
        <Host matchContents style={style}>
            <DropdownMenu expanded={isMenuExpanded} onDismissRequest={handleDismissMenu}>
                <DropdownMenu.Trigger>
                    <RNHostView matchContents>
                        <Pressable onLongPress={handleLongPress}>{children}</Pressable>
                    </RNHostView>
                </DropdownMenu.Trigger>
                <DropdownMenu.Items>
                    {actions.map(({ label, onPress }) => (
                        <DropdownMenuItem
                            key={label}
                            onClick={() => {
                                handleDismissMenu();
                                void onPress();
                            }}
                        >
                            <DropdownMenuItem.Text>
                                <Text>{label}</Text>
                            </DropdownMenuItem.Text>
                        </DropdownMenuItem>
                    ))}
                </DropdownMenu.Items>
            </DropdownMenu>
        </Host>
    );
};
