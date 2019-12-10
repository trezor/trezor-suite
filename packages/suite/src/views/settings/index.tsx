import React from 'react';
// import styled from 'styled-components';
import { SuiteLayout, SettingsMenu } from '@suite-components';

const Settings = () => {
    return (
        <SuiteLayout title="Settings" secondaryMenu={<SettingsMenu />}>
            Settings
        </SuiteLayout>
    );
};

export default Settings;
