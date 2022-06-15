// @flow
import React from 'react';

import { ListItem } from '@suite-native/atoms';

import { SettingsSection } from './SettingsSection';

import { SettingItem } from '../types';

const deviceSettingItems: SettingItem[] = [
    { title: 'Customization', description: 'Name, Homescreen', iconName: 'palette' },
    { title: 'Security', description: 'PIN Active, Passphrase enabled', iconName: 'lock' },
    { title: 'Danger Area', description: 'Factory reset, Custom firmware', iconName: 'lock' },
];

export const DeviceSettings = () => (
    <SettingsSection title="Device">
        {deviceSettingItems.map(item => (
            <ListItem
                key={item.title}
                iconName={item.iconName}
                title={item.title}
                subtitle={item.description}
                hasRightArrow
            />
        ))}
    </SettingsSection>
);
