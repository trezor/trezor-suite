import React from 'react';

import { SettingsLayout } from '@settings-components';
import { SettingsSection } from '@suite-components/Settings';
import { Translation } from '@suite-components';
import { useLayoutSize, useSelector } from '@suite-hooks';
import { isDesktop, isWeb } from '@trezor/env-utils';

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
import { BitcoinAmountUnit } from './BitcoinAmountUnit';
import { NETWORKS } from '@wallet-config';
import { DesktopSuiteBanner } from './DesktopSuiteBanner';
import { selectTorState } from '@suite-reducers/suiteReducer';
import { selectEnabledNetworks } from '@wallet-reducers/settingsReducer';

export const SettingsGeneral = () => {
    const isPromoHidden = useSelector(state => state.suite.settings.isDesktopSuitePromoHidden);
    const { isTorEnabled } = useSelector(selectTorState);
    const enabledNetworks = useSelector(selectEnabledNetworks);
    const desktopUpdate = useSelector(state => state.desktopUpdate);

    const { isMobileLayout } = useLayoutSize();

    const hasBitcoinNetworks = NETWORKS.some(
        ({ symbol, features }) =>
            enabledNetworks.includes(symbol) && features?.includes('amount-unit'),
    );

    return (
        <SettingsLayout data-test="@settings/index">
            {isWeb() && !isMobileLayout && !isPromoHidden && <DesktopSuiteBanner />}

            <SettingsSection title={<Translation id="TR_LOCALIZATION" />} icon="FLAG">
                <Language />
                <Fiat />
                {hasBitcoinNetworks && <BitcoinAmountUnit />}
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
                    icon="EXPERIMENTAL"
                >
                    <EarlyAccess />
                </SettingsSection>
            )}
        </SettingsLayout>
    );
};
