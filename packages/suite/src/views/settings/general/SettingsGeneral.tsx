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
import { ShowApplicationLog } from './ShowApplicationLog';
import { ClearStorage } from './ClearStorage';
import { VersionWithUpdate } from './VersionWithUpdate';
import { EarlyAccess } from './EarlyAccess';
import { getIsTorEnabled } from '@suite-utils/tor';
import { BitcoinAmountUnit } from './BitcoinAmountUnit';
import { NETWORKS } from '@wallet-config';

export const SettingsGeneral = () => {
    const { desktopUpdate, isTorEnabled, enabledNetworks, isInDebugMode } = useSelector(state => ({
        desktopUpdate: state.desktopUpdate,
        isTorEnabled: getIsTorEnabled(state.suite.torStatus),
        enabledNetworks: state.wallet.settings.enabledNetworks,
        isInDebugMode: state.suite.settings.debug.showDebugMenu,
    }));

    const hasBitcoinNetworks = NETWORKS.some(
        ({ symbol, features }) =>
            enabledNetworks.includes(symbol) && features?.includes('amount-unit'),
    );

    // TEMPORARY SOLUTION!
    const isUnitSectionShown = hasBitcoinNetworks && isInDebugMode;

    return (
        <SettingsLayout data-test="@settings/index">
            <SettingsSection title={<Translation id="TR_LOCALIZATION" />} icon="FLAG">
                <Language />
                <Fiat />
                {isUnitSectionShown && <BitcoinAmountUnit />}
            </SettingsSection>

            <SettingsSection title={<Translation id="TR_LABELING" />} icon="TAG_MINIMAL">
                <Labeling />
                <LabelingDisconnect />
                <LabelingConnect />
            </SettingsSection>

            {(isDesktop() || (isWeb() && isTorEnabled)) && (
                <SettingsSection title={<Translation id="TR_TOR" />} icon="TOR_MINIMAL">
                    {isDesktop() && <Tor />}
                    {isTorEnabled && <TorOnionLinks />}
                </SettingsSection>
            )}

            <SettingsSection title={<Translation id="TR_APPLICATION" />} icon="APP">
                <Theme />
                <Analytics />
                <ShowApplicationLog />
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
