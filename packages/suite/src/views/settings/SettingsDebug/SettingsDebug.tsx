import { isDesktop, isWeb } from '@trezor/env-utils';

import { SettingsLayout, SettingsSection } from 'src/components/settings';
import { useSelector } from 'src/hooks/suite';
import { selectSuiteFlags } from 'src/reducers/suite/suiteReducer';

import { Backends } from './Backends';
import { CheckFirmwareAuthenticity } from './CheckFirmwareAuthenticity';
import { CoinjoinApi } from './CoinjoinApi';
import { DeviceAuthenticity } from './DeviceAuthenticity';
import { Devkit } from './Devkit';
import { GithubIssue } from './GithubIssue';
import { InvityApi } from './InvityApi';
import { MessageSystemDebugInfo } from './MessageSystemDebugInfo';
import { Metadata } from './Metadata';
import { OAuthApi } from './OAuthApi';
import { PreField } from './PreField';
import { ThrowTestingError } from './ThrowTestingError';
import { Tor } from './Tor';
import { TranslationMode } from './TranslationMode';
import { Transport } from './Transport';
import { TransportBackends } from './TransportBackends';
import { TriggerHighlight } from './TriggerHighlight';
import { ViewOnlySettings } from './ViewOnlySettings';
import { WalletConnect } from './WalletConnect';
import { WipeData } from './WipeData';

export const SettingsDebug = () => {
    const flags = useSelector(selectSuiteFlags);

    return (
        <SettingsLayout>
            {isWeb() && (
                <SettingsSection title="Localization">
                    <TranslationMode />
                </SettingsSection>
            )}
            <SettingsSection title="Debug">
                <GithubIssue />
                {!isWeb() && <WipeData />}
                <TriggerHighlight />
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
                <SettingsSection title="Transport backends">
                    <TransportBackends />
                </SettingsSection>
            )}
            <SettingsSection title="Transport clients">
                <Transport />
            </SettingsSection>
            {isDesktop() && (
                <SettingsSection title="Tor">
                    <Tor />
                </SettingsSection>
            )}
            <SettingsSection title="Backends">
                <Backends />
            </SettingsSection>
            <SettingsSection title="View only">
                <ViewOnlySettings />
            </SettingsSection>
            <SettingsSection title="Flags JSON">
                <PreField>{JSON.stringify(flags)}</PreField>
            </SettingsSection>
            <SettingsSection title="Metadata">
                <Metadata />
            </SettingsSection>
            <SettingsSection title="Message system info">
                <MessageSystemDebugInfo />
            </SettingsSection>
            <SettingsSection title="WalletConnect">
                <WalletConnect />
            </SettingsSection>
        </SettingsLayout>
    );
};
