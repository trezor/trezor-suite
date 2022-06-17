import React from 'react';

import { ListItem } from '@suite-native/atoms';

import { SettingsSection } from './SettingsSection';

import { SettingItem } from '../types';
import { SettingsStackRoutes } from '../navigation/routes';

const applicationSettingsItems: SettingItem[] = [
    {
        title: 'Localisation',
        description: 'Language, Currency',
        iconName: 'flag',
        route: SettingsStackRoutes.SettingsLocalisation,
    },
    {
        title: 'Labeling',
        description: 'Saved locally',
        iconName: 'label',
        route: SettingsStackRoutes.SettingsLabeling,
    },
    {
        title: 'Advanced',
        description: 'Usage data, Logs',
        iconName: 'eyeglasses',
        route: SettingsStackRoutes.SettingsAdvanced,
    },
];
export const ApplicationSettings = ({ onRedirect }: any) => (
    <SettingsSection title="Aplication">
        {applicationSettingsItems.map(item => (
            <ListItem
                key={item.title}
                iconName={item.iconName}
                title={item.title}
                subtitle={item.description}
                onPress={() => onRedirect(item.route)}
                hasRightArrow
            />
        ))}
    </SettingsSection>
);
