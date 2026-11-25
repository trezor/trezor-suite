import { useState } from 'react';
import { Pressable } from 'react-native';

import { DropdownMenu, DropdownMenuItem, Host, RNHostView, Text } from '@expo/ui/jetpack-compose';

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
