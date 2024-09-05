import { isDesktop, isWeb } from '@trezor/env-utils';

import { SettingsLayout, SettingsSection } from 'src/components/settings';
import { Translation } from 'src/components/suite';
import { useLayoutSize, useSelector } from 'src/hooks/suite';
import {
    selectHasExperimentalFeature,
    selectIsSettingsDesktopAppPromoBannerShown,
    selectTorState,
} from 'src/reducers/suite/suiteReducer';
import { selectEnabledNetworks } from 'src/reducers/wallet/settingsReducer';
import { selectSelectedProviderForLabels } from 'src/reducers/suite/metadataReducer';

import { Language } from './Language';
import { Fiat } from './Fiat';
import { Labeling } from './Labeling';
import { DisconnectLabelingProvider } from './DisconnectLabelingProvider';
import { ConnectLabelingProvider } from './ConnectLabelingProvider';
import { Tor } from './Tor';
import { TorOnionLinks } from './TorOnionLinks';
import { Theme } from './Theme';
import { Analytics } from './Analytics';
import { ShowApplicationLog } from './ShowApplicationLog';
import { ClearStorage } from './ClearStorage';
import { VersionWithUpdate } from './VersionWithUpdate';
import { EarlyAccess } from './EarlyAccess';
import { BitcoinAmountUnit } from './BitcoinAmountUnit';
import { DesktopSuiteBanner } from './DesktopSuiteBanner';
import { AddressDisplay } from './AddressDisplay';
import { EnableViewOnly } from './EnableViewOnly';
import { Experimental } from './Experimental';
import { networksCompatibility } from '@suite-common/wallet-config';
import { TorSnowflake } from './TorSnowflake';
import { AutomaticUpdate } from './AutomaticUpdate';

export const SettingsGeneral = () => {
    const shouldShowSettingsDesktopAppPromoBanner = useSelector(
        selectIsSettingsDesktopAppPromoBannerShown,
    );

    const { isTorEnabled } = useSelector(selectTorState);
    const enabledNetworks = useSelector(selectEnabledNetworks);
    const desktopUpdate = useSelector(state => state.desktopUpdate);
    const metadata = useSelector(state => state.metadata);
    const { isMobileLayout } = useLayoutSize();
    const torSnowflakeExperimentalFeature = useSelector(
        selectHasExperimentalFeature('tor-snowflake'),
    );

    const hasBitcoinNetworks = networksCompatibility.some(
        ({ symbol, features }) =>
            enabledNetworks.includes(symbol) && features?.includes('amount-unit'),
    );

    const isMetadataEnabled = metadata.enabled && !metadata.initiating;
    const isProviderConnected = useSelector(selectSelectedProviderForLabels);

    return (
        <SettingsLayout data-testid="@settings/index">
            {isWeb() && !isMobileLayout && shouldShowSettingsDesktopAppPromoBanner && (
                <DesktopSuiteBanner />
            )}

            <SettingsSection title={<Translation id="TR_LOCALIZATION" />} icon="flag">
                <Language />
                <Fiat />
                {hasBitcoinNetworks && <BitcoinAmountUnit />}
            </SettingsSection>

            <SettingsSection title={<Translation id="TR_LABELING" />} icon="tag">
                <Labeling />
                {isMetadataEnabled &&
                    (isProviderConnected ? (
                        <DisconnectLabelingProvider />
                    ) : (
                        <ConnectLabelingProvider />
                    ))}
            </SettingsSection>

            {(isDesktop() || (isWeb() && isTorEnabled)) && (
                <SettingsSection title={<Translation id="TR_TOR" />} icon="torBrowser">
                    {isDesktop() && <Tor />}
                    {isTorEnabled && <TorOnionLinks />}
                    {isDesktop() && torSnowflakeExperimentalFeature && <TorSnowflake />}
                </SettingsSection>
            )}

            <SettingsSection title={<Translation id="TR_APPLICATION" />} icon="appWindow">
                <Theme />
                <AddressDisplay />
                <Analytics />
                <ShowApplicationLog />
                <ClearStorage />
                <AutomaticUpdate />
                <VersionWithUpdate />
            </SettingsSection>

            <SettingsSection title={<Translation id="TR_VIEW_ONLY" />} icon="link">
                <EnableViewOnly />
            </SettingsSection>

            <SettingsSection
                title={<Translation id="TR_EXPERIMENTAL_FEATURES" />}
                icon="experimental"
            >
                {desktopUpdate.enabled && <EarlyAccess />}
                <Experimental />
            </SettingsSection>
        </SettingsLayout>
    );
};
