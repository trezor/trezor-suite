import React from 'react';

import { SettingsSection } from './SettingsSection';
import { SettingsSectionItem } from './SettingsSectionItem';

export const DeviceSettings = () => (
    <SettingsSection title="Device">
        <SettingsSectionItem title="Customization" iconName="palette" subtitle="Name, Homescreen" />
        <SettingsSectionItem
            title="Security"
            iconName="lock"
            subtitle="PIN Active, Passphrase enabled"
        />
        <SettingsSectionItem
            title="Danger Area"
            iconName="lock"
            subtitle="Factory reset, Custom firmware"
        />
    </SettingsSection>
);
