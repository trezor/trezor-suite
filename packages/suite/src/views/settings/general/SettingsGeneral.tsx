import React from 'react';

import { SettingsLayout } from '@settings-components';
import { SettingsSection } from '@suite-components/Settings';
import { Translation } from '@suite-components';
import { useSelector } from '@suite-hooks';
import { isDesktop, isWeb } from '@suite-utils/env';

import { Language } from './Language';
import { Fiat } from './Fiat';
import { Labeling } from './Labeling';
import { LabelingDisconnect } from './LabelingDisconnect';
import { LabelingConnect } from './LabelingConnect';
import { Tor } from './Tor';
import { TorOnionLinks } from './TorOnionLinks';
import { Theme } from './Theme';
import { Analytics } from './Analytics';
import { ShowLog } from './ShowLog';
import { ClearStorage } from './ClearStorage';
import { VersionWithUpdate } from './VersionWithUpdate';
import { EarlyAccess } from './EarlyAccess';

export const SettingsGeneral = () => {
    const { desktopUpdate, tor } = useSelector(state => ({
        desktopUpdate: state.desktopUpdate,
        tor: state.suite.tor,
    }));

    return (
        <SettingsLayout data-test="@settings/index">
            <SettingsSection title={<Translation id="TR_LOCALIZATION" />} icon="FLAG">
                <Language />
                <Fiat />
            </SettingsSection>

            <SettingsSection title={<Translation id="TR_LABELING" />} icon="TAG_MINIMAL">
                <Labeling />
                <LabelingDisconnect />
                <LabelingConnect />
            </SettingsSection>

            {(isDesktop() || (isWeb() && tor)) && (
                <SettingsSection title={<Translation id="TR_TOR" />} icon="TOR_MINIMAL">
                    {isDesktop() && <Tor />}
                    {tor && <TorOnionLinks />}
                </SettingsSection>
            )}

            <SettingsSection title={<Translation id="TR_APPLICATION" />} icon="APP">
                <Theme />
                <Analytics />
                <ShowLog />
                <ClearStorage />
                <VersionWithUpdate />
            </SettingsSection>

            {desktopUpdate.enabled && (
                <SettingsSection
                    title={<Translation id="TR_EXPERIMENTAL_FEATURES" />}
                    icon="SPARKLE"
                >
                    <EarlyAccess />
                </SettingsSection>
            )}
        </SettingsLayout>
    );
};
