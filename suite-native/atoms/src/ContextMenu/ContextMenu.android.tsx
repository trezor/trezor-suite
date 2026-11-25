import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { DropdownMenu, DropdownMenuItem, Host, Text } from '@expo/ui/jetpack-compose';
import { fillMaxSize } from '@expo/ui/jetpack-compose/modifiers';

import type { ContextMenuProps } from './ContextMenu.types';

export const ContextMenu = ({ actions, children, style }: ContextMenuProps) => {
    const [isMenuExpanded, setIsMenuExpanded] = useState(false);

    const handleLongPress = () => {
        setIsMenuExpanded(true);
    };

    const handleDismissMenu = () => {
        setIsMenuExpanded(false);
    };

    return (
        <Pressable onLongPress={handleLongPress} style={style}>
            {children}
            {/* The children stay in the React Native tree so Yoga keeps constraining them (text
            truncation, flex shrinking). The host only overlays them as the menu anchor. */}
            <Host pointerEvents="none" style={StyleSheet.absoluteFill}>
                <DropdownMenu
                    expanded={isMenuExpanded}
                    onDismissRequest={handleDismissMenu}
                    modifiers={[fillMaxSize()]}
                >
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
        </Pressable>
    );
};
