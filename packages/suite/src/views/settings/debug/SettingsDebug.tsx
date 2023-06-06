import React from 'react';

import { SettingsLayout } from '@settings-components';
import { SettingsSection } from '@suite-components/Settings';
import { isWeb } from '@suite-utils/env';

import { TranslationMode } from './TranslationMode';
import { GithubIssue } from './GithubIssue';
import { WipeData } from './WipeData';
import { ThrowTestingError } from './ThrowTestingError';
import { InvityApi } from './InvityApi';
import { CoinjoinApi } from './CoinjoinApi';
import { OAuthApi } from './OAuthApi';
import { CheckFirmwareAuthenticity } from './CheckFirmwareAuthenticity';
import { Devkit } from './Devkit';
import { Transport } from './Transport';
import { Processes } from './Processes';
import { Metadata } from './Metadata';
import { PasswordManager } from './Passwords';

export const SettingsDebug = () => (
    <SettingsLayout>
        {isWeb() && (
            <SettingsSection title="Localization">
                <TranslationMode />
            </SettingsSection>
        )}
        <SettingsSection title="Debug">
            <GithubIssue />
            {!isWeb() && <WipeData />}
        </SettingsSection>
        <SettingsSection title="Invity">
            <InvityApi />
        </SettingsSection>
        <SettingsSection title="OAuth">
            <OAuthApi />
        </SettingsSection>
        <SettingsSection title="Coinjoin">
            <CoinjoinApi />
        </SettingsSection>
        <SettingsSection title="Firmware">
            <Devkit />
            <CheckFirmwareAuthenticity />
        </SettingsSection>
        <SettingsSection title="Testing">
            <ThrowTestingError />
        </SettingsSection>
        {!isWeb() && (
            <SettingsSection title="Processes">
                <Processes />
            </SettingsSection>
        )}
        <SettingsSection title="Transports">
            <Transport />
        </SettingsSection>
        <SettingsSection title="Labeling viewer">
            <Metadata />
        </SettingsSection>
        <SettingsSection title="Password manager">
            <PasswordManager />
        </SettingsSection>
    </SettingsLayout>
);
