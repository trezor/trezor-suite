import { selectIsSettingsDesktopAppPromoBannerShown } from '@suite/flags';
import { Translation } from '@suite/intl';
import { selectIsMetadataEnabled, selectSelectedProviderForLabels } from '@suite/metadata';
import { selectHasExperimentalFeature } from '@suite/settings';
import { Context } from '@suite-common/message-system';
import { selectIsMevProtectionSettingsVisible } from '@suite-common/mev';
import { getNetwork } from '@suite-common/wallet-config';
import {
    selectEnabledNetworks,
    selectIsDustPhishingThresholdSettingsVisible,
    selectIsNetworkReserveSettingsVisible,
} from '@suite-common/wallet-core';
import { isDesktop, isLinux, isWeb } from '@trezor/env-utils';
import { SettingsSection } from '@trezor/product-components';

import { SettingsLayout } from 'src/components/settings/SettingsLayout';
import { ContextMessage } from 'src/components/wallet/WalletLayout/AccountBanners/ContextMessage';
import { useLayoutSize, useSelector } from 'src/hooks/suite';
import { selectTorState } from 'src/selectors/suite/suiteSelectors';
import { TorStatus } from 'src/types/suite';

import { AddressDisplay } from './AddressDisplay';
import { Analytics } from './Analytics';
import { AutoEject } from './AutoEject';
import { AutoStart } from './AutoStart';
import { AutomaticUpdate } from './AutomaticUpdate';
import { BaseCurrency } from './BaseCurrency';
import { BioAuthSettings } from './BioAuthSettings';
import { BitcoinAmountUnit } from './BitcoinAmountUnit';
import { ClearStorage } from './ClearStorage';
import { ConnectLabelingProvider } from './ConnectLabelingProvider';
import { DesktopSuiteBanner } from './DesktopSuiteBanner';
import { DisconnectLabelingProvider } from './DisconnectLabelingProvider';
import { DustPhishing } from './DustPhishing';
import { EarlyAccess } from './EarlyAccess';
import { Experimental } from './Experimental';
import { Language } from './Language';
import { MevProtection } from './MevProtection';
import { NetworkReserve } from './NetworkReserve';
import { ShowApplicationLog } from './ShowApplicationLog';
import { ShowOnTray } from './ShowOnTray';
import { Theme } from './Theme';
import { Tor } from './Tor';
import { TorExternal } from './TorExternal';
import { TorOnionLinks } from './TorOnionLinks';
import { VersionWithUpdate } from './VersionWithUpdate';
import { Labeling } from '../labeling/Labeling';

export const SettingsGeneral = () => {
    const shouldShowSettingsDesktopAppPromoBanner = useSelector(
        selectIsSettingsDesktopAppPromoBannerShown,
    );

    const { isTorEnabled } = useSelector(selectTorState);
    const torStatus = useSelector(state => state.suite.torStatus);
    const enabledNetworks = useSelector(selectEnabledNetworks);
    const desktopUpdate = useSelector(state => state.desktopUpdate);
    const isMetadataEnabled = useSelector(selectIsMetadataEnabled);
    const { isBelowLaptop, isBelowTablet } = useLayoutSize();

    const hasBitcoinNetworks = enabledNetworks.some(symbol => {
        const networkFeatures = getNetwork(symbol).features;

        return networkFeatures.includes('amount-unit');
    });

    const torExternalExperimentalFeature = useSelector(
        selectHasExperimentalFeature('tor-external'),
    );

    const isProviderConnected = useSelector(selectSelectedProviderForLabels);
    const isMevProtectionSettingsVisible = useSelector(selectIsMevProtectionSettingsVisible);
    const isNetworkReserveSettingsVisible = useSelector(selectIsNetworkReserveSettingsVisible);
    const isDustPhishingThresholdSettingsVisible = useSelector(
        selectIsDustPhishingThresholdSettingsVisible,
    );

    const isSecuritySettingsSectionVisible =
        isMevProtectionSettingsVisible || isDustPhishingThresholdSettingsVisible;

    return (
        <SettingsLayout data-testid="@settings/index">
            <ContextMessage context={Context.getSettings('general')} />

            <div>
                {isWeb() && !isBelowTablet && shouldShowSettingsDesktopAppPromoBanner && (
                    <DesktopSuiteBanner />
                )}

                <SettingsSection
                    isBelowLaptop={isBelowLaptop}
                    title={<Translation id="TR_LOCALIZATION" />}
                    icon="flag"
                >
                    <Language />
                    <BaseCurrency />
                    {hasBitcoinNetworks && <BitcoinAmountUnit />}
                </SettingsSection>
            </div>

            <SettingsSection
                isBelowLaptop={isBelowLaptop}
                title={<Translation id="TR_LABELING" />}
                icon="tag"
            >
                <Labeling />
                {isMetadataEnabled &&
                    (isProviderConnected ? (
                        <DisconnectLabelingProvider />
                    ) : (
                        <ConnectLabelingProvider />
                    ))}
            </SettingsSection>

            <SettingsSection
                isBelowLaptop={isBelowLaptop}
                title={<Translation id="TR_PRIVACY" />}
                icon="lock"
            >
                <AutoEject />
                {isDesktop() && !isLinux() && <BioAuthSettings />}
                {(isDesktop() || (isWeb() && isTorEnabled)) && (
                    <>
                        {isDesktop() && <Tor />}
                        {(isTorEnabled || torStatus === TorStatus.Enabling) && <TorOnionLinks />}
                        {torExternalExperimentalFeature && <TorExternal />}
                    </>
                )}
            </SettingsSection>

            <SettingsSection
                isBelowLaptop={isBelowLaptop}
                title={<Translation id="TR_APPLICATION" />}
                icon="appWindow"
            >
                <Theme />
                <AddressDisplay />
                <Analytics />
                <ShowApplicationLog />
                <ClearStorage />
                <AutomaticUpdate />
                <VersionWithUpdate />
            </SettingsSection>

            {isSecuritySettingsSectionVisible && (
                <SettingsSection
                    title={<Translation id="TR_SECURITY" />}
                    icon="shield"
                    isBelowLaptop={isBelowLaptop}
                >
                    {isMevProtectionSettingsVisible && <MevProtection />}
                    {isDustPhishingThresholdSettingsVisible && <DustPhishing />}
                </SettingsSection>
            )}

            {isNetworkReserveSettingsVisible && (
                <SettingsSection
                    isBelowLaptop={isBelowLaptop}
                    title={<Translation id="TR_NETWORKS" />}
                    icon="graph"
                >
                    <NetworkReserve />
                </SettingsSection>
            )}

            {isDesktop() && (
                <SettingsSection
                    isBelowLaptop={isBelowLaptop}
                    title={<Translation id="TR_TREZOR_CONNECT" />}
                    icon="plugs"
                >
                    <AutoStart />
                    <ShowOnTray />
                </SettingsSection>
            )}

            <SettingsSection
                isBelowLaptop={isBelowLaptop}
                title={<Translation id="TR_EXPERIMENTAL_FEATURES" />}
                icon="atom"
            >
                {desktopUpdate.enabled && <EarlyAccess />}
                <Experimental />
            </SettingsSection>
        </SettingsLayout>
    );
};
