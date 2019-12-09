import React from 'react';
// import styled from 'styled-components';
import { SettingsLayout } from '@suite-components';

/* TODO for both: { name: 'homescreen', type: 'string' }, custom load */
/* TODO for T2: 
                { name: 'passphrase_source', type: 'number' }, is not in features, so probably skip for now ?
                { name: 'auto_lock_delay_ms', type: 'number' }, is not implemented, skip for now.
            */

const Settings = () => {
    return <SettingsLayout title="Settings">Settings</SettingsLayout>;
};

export default Settings;
