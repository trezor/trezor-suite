import { isWeb } from '@trezor/env-utils';

import { SettingsSection, SettingsLayout } from 'src/components/settings';

import { TranslationMode } from './TranslationMode';
import { GithubIssue } from './GithubIssue';
import { WipeData } from './WipeData';
import { ThrowTestingError } from './ThrowTestingError';
import { InvityApi } from './InvityApi';
import { CoinjoinApi } from './CoinjoinApi';
import { OAuthApi } from './OAuthApi';
import { CheckFirmwareAuthenticity } from './CheckFirmwareAuthenticity';
import { DeviceAuthenticity } from './DeviceAuthenticity';
import { Devkit } from './Devkit';
import { Transport } from './Transport';
import { Processes } from './Processes';

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
        <SettingsSection title="Device">
            <DeviceAuthenticity />
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
    </SettingsLayout>
);
