import { useState } from 'react';
import { type ImageSourcePropType, Pressable, StyleSheet } from 'react-native';

import ContentCopyIcon from '@expo/material-symbols/content_copy.xml';
import DownloadIcon from '@expo/material-symbols/download.xml';
import QRCodeIcon from '@expo/material-symbols/qr_code.xml';
import ShareIcon from '@expo/material-symbols/share.xml';
import { DropdownMenu, DropdownMenuItem, Host, Icon, Text } from '@expo/ui/jetpack-compose';
import { fillMaxSize } from '@expo/ui/jetpack-compose/modifiers';

import type { ContextMenuIcon, ContextMenuProps } from './ContextMenu.types';

const iconSourceByIcon: Record<ContextMenuIcon, ImageSourcePropType> = {
    share: ShareIcon,
    download: DownloadIcon,
    qrCode: QRCodeIcon,
    copy: ContentCopyIcon,
};

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
                        {actions.map(({ label, icon, onPress }) => (
                            <DropdownMenuItem
                                key={label}
                                onClick={() => {
                                    handleDismissMenu();
                                    void onPress();
                                }}
                            >
                                {icon !== undefined && (
                                    <DropdownMenuItem.LeadingIcon>
                                        <Icon source={iconSourceByIcon[icon]} />
                                    </DropdownMenuItem.LeadingIcon>
                                )}
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
