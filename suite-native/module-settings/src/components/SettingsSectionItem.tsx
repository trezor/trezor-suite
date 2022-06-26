import { ListItem, ListItemProps } from '@suite-native/atoms';
import { IconName } from '@trezor/icons';
import React from 'react';

export type SettingSectionItem = {
    title: string;
    subtitle: string;
    iconName: IconName;
};

export const SettingsSectionItem = ({ title, subtitle, iconName, onPress }: ListItemProps) => (
    <ListItem
        onPress={onPress}
        subtitle={subtitle}
        title={title}
        iconName={iconName}
        hasRightArrow
    />
);
