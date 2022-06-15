import React from 'react';

import { ListItem } from '@suite-native/atoms';

import { SettingsSection } from './SettingsSection';

import { SettingItem } from '../types';

const applicationSettingsItems: SettingItem[] = [
    { title: 'Localisation', description: 'Language, Currency', iconName: 'flag' },
    { title: 'Labeling', description: 'Saved locally', iconName: 'label' },
    { title: 'Advanced', description: 'Usage data, Logs', iconName: 'eyeglasses' },
];

export const ApplicationSettings = () => (
    <SettingsSection title="Aplication">
        {applicationSettingsItems.map(item => (
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
