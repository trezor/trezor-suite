import React from 'react';
import { SuiteLayout } from '@suite-components';
import { Menu as SettingsMenu } from '@settings-components';

// TODO: this is probably deprecated screen

export default () => (
    <SuiteLayout title="Dashboard settings" secondaryMenu={<SettingsMenu />}>
        Dashboard settings
    </SuiteLayout>
);
