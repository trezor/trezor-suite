import React from 'react';

import { SettingsLayout } from '@settings-components';
import { Section } from '@suite-components/Settings';
import { Translation } from '@suite-components';
import { useSelector } from '@suite-hooks';
import { isDesktop, isWeb } from '@suite-utils/env';

import { Language } from './Language';
import { Fiat } from './Fiat';
import { Labeling } from './Labeling';
import { LabelingDisconnect } from './LabelingDisconnect';
import { LabelingConnect } from './LabelingConnect';
import { Tor } from './Tor';
import { TorAddress } from './TorAddress';
import { TorOnionLinks } from './TorOnionLinks';
import { Theme } from './Theme';
import { Analytics } from './Analytics';
import { ShowLog } from './ShowLog';
import { ClearStorage } from './ClearStorage';
import { VersionWithUpdate } from './VersionWithUpdate';
import { EarlyAccess } from './EarlyAccess';

const SettingsGeneral = () => {
    const { desktopUpdate, tor } = useSelector(state => ({
        desktopUpdate: state.desktopUpdate,
        tor: state.suite.tor,
    }));

    return (
        <SettingsLayout data-test="@settings/index">
            <Section title={<Translation id="TR_LOCALIZATION" />}>
                <Language />
                <Fiat />
            </Section>

            <Section title={<Translation id="TR_LABELING" />}>
                <Labeling />
                <LabelingDisconnect />
                <LabelingConnect />
            </Section>

            {(isDesktop() || (isWeb() && tor)) && (
                <Section title={<Translation id="TR_TOR" />}>
                    {isDesktop() && <Tor />}
                    {isDesktop() && <TorAddress />}
                    {tor && <TorOnionLinks />}
                </Section>
            )}

            <Section title={<Translation id="TR_APPLICATION" />}>
                <Theme />
                <Analytics />
                <ShowLog />
                <ClearStorage />
                <VersionWithUpdate />
            </Section>

            {desktopUpdate.enabled && (
                <Section title={<Translation id="TR_EXPERIMENTAL_FEATURES" />}>
                    <EarlyAccess />
                </Section>
            )}
        </SettingsLayout>
    );
};

export default SettingsGeneral;
