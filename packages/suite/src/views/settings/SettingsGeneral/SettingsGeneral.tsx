import { selectIsSettingsDesktopAppPromoBannerShown } from '@suite/flags';
import { Translation } from '@suite/intl';
import { LabelingSettings } from '@suite/labeling';
import { ContextMessage } from '@suite/message-system';
import { selectIsLegacyLabelingVisible, selectSelectedProviderForLabels } from '@suite/metadata';
import { selectHasExperimentalFeature } from '@suite/settings';
import { TorStatus, selectTorState } from '@suite/tor';
import { Context } from '@suite-common/message-system';
import { getNetwork } from '@suite-common/wallet-config';
import {
    selectEnabledNetworks,
    selectIsNetworkReserveSettingsVisible,
} from '@suite-common/wallet-core';
import { isDesktop, isLinux, isWeb } from '@trezor/env-utils';
import {
    AppWindowIcon,
    AtomIcon,
    FlagIcon,
    LockIcon,
    PlugsIcon,
    ShieldIcon,
    ShieldWarningIcon,
    TagIcon,
} from '@trezor/icons';
import { SettingsSection } from '@trezor/product-components';
import { breakpoints } from '@trezor/theme';

import { SettingsLayout } from 'src/components/settings/SettingsLayout';
import { useSelector } from 'src/hooks/suite';
import { useIsContentBelowBreakpoint } from 'src/support/suite/ContentFlex';

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
import { LegacyLabelingMigration } from './LegacyLabelingMigration';
import { McpServer } from './McpServer';
import { NetworkReserve } from './NetworkReserve';
import { NftSection } from './NftSection';
import { ShowApplicationLog } from './ShowApplicationLog';
import { ShowOnTray } from './ShowOnTray';
import { TestnetNetworks } from './TestnetNetworks';
import { Theme } from './Theme';
import { Tor } from './Tor';
import { TorExternal } from './TorExternal';
import { TorOnionLinks } from './TorOnionLinks';
import { VersionWithUpdate } from './VersionWithUpdate';

export const SettingsGeneral = () => {
    const shouldShowSettingsDesktopAppPromoBanner = useSelector(
        selectIsSettingsDesktopAppPromoBannerShown,
    );

    const { isTorEnabled } = useSelector(selectTorState);
    const torStatus = useSelector(state => state.tor.torStatus);
    const enabledNetworks = useSelector(selectEnabledNetworks);
    const desktopUpdate = useSelector(state => state.desktopUpdate);
    const isLegacyLabelingVisible = useSelector(selectIsLegacyLabelingVisible);
    const hasContentBelowTabletWidth = useIsContentBelowBreakpoint(breakpoints.tablet);
    const hasContentBelowMobileWidth = useIsContentBelowBreakpoint(breakpoints.mobile);

    const hasBitcoinNetworks = enabledNetworks.some(symbol => {
        const networkFeatures = getNetwork(symbol).features;

        return networkFeatures.includes('amount-unit');
    });

    const torExternalExperimentalFeature = useSelector(
        selectHasExperimentalFeature('tor-external'),
    );
    const mcpServerEnabled = useSelector(selectHasExperimentalFeature('mcp-server'));

    const isProviderConnected = useSelector(selectSelectedProviderForLabels);
    const isNetworkReserveSettingsVisible = useSelector(selectIsNetworkReserveSettingsVisible);

    return (
        <SettingsLayout data-testid="@settings/index">
            <ContextMessage context={Context.getSettings('general')} />

            <div>
                {isWeb() &&
                    !hasContentBelowMobileWidth &&
                    shouldShowSettingsDesktopAppPromoBanner && <DesktopSuiteBanner />}

                <SettingsSection
                    hasVerticalLayout={hasContentBelowTabletWidth}
                    title={<Translation id="TR_PRIVACY" />}
                    icon={LockIcon}
                >
                    <AutoEject />
                    {isDesktop() && !isLinux() && <BioAuthSettings />}
                    {(isDesktop() || (isWeb() && isTorEnabled)) && (
                        <>
                            {isDesktop() && <Tor />}
                            {(isTorEnabled || torStatus === TorStatus.Enabling) && (
                                <TorOnionLinks />
                            )}
                            {torExternalExperimentalFeature && <TorExternal />}
                        </>
                    )}
                </SettingsSection>
            </div>

            <SettingsSection
                hasVerticalLayout={hasContentBelowTabletWidth}
                title={<Translation id="TR_LOCALIZATION" />}
                icon={FlagIcon}
            >
                <Language />
                <BaseCurrency />
                {hasBitcoinNetworks && <BitcoinAmountUnit />}
            </SettingsSection>

            <SettingsSection
                hasVerticalLayout={hasContentBelowTabletWidth}
                title={<Translation id="TR_LABELING" />}
                icon={TagIcon}
            >
                <LabelingSettings />
                {isLegacyLabelingVisible &&
                    (isProviderConnected ? (
                        <DisconnectLabelingProvider />
                    ) : (
                        <ConnectLabelingProvider />
                    ))}
                <LegacyLabelingMigration />
            </SettingsSection>

            <SettingsSection
                hasVerticalLayout={hasContentBelowTabletWidth}
                title={<Translation id="TR_APPLICATION" />}
                icon={AppWindowIcon}
            >
                <Theme />
                <Analytics />
                <ShowApplicationLog />
                <ClearStorage />
                <AutomaticUpdate />
                <VersionWithUpdate />
            </SettingsSection>

            <SettingsSection
                title={<Translation id="TR_SECURITY" />}
                icon={ShieldIcon}
                hasVerticalLayout={hasContentBelowTabletWidth}
            >
                <DustPhishing />
            </SettingsSection>

            <SettingsSection
                hasVerticalLayout={hasContentBelowTabletWidth}
                title={<Translation id="TR_SETTINGS_ADVANCED" />}
                icon={ShieldWarningIcon}
            >
                {desktopUpdate.enabled && <EarlyAccess />}
                <AddressDisplay />
                {isNetworkReserveSettingsVisible && <NetworkReserve />}
                <TestnetNetworks />
                <NftSection />
            </SettingsSection>

            {isDesktop() && (
                <SettingsSection
                    hasVerticalLayout={hasContentBelowTabletWidth}
                    title={<Translation id="TR_TREZOR_CONNECT" />}
                    icon={PlugsIcon}
                >
                    <AutoStart />
                    <ShowOnTray />
                </SettingsSection>
            )}

            <SettingsSection
                hasVerticalLayout={hasContentBelowTabletWidth}
                title={<Translation id="TR_EXPERIMENTAL_FEATURES" />}
                icon={AtomIcon}
            >
                <Experimental />
            </SettingsSection>

            {mcpServerEnabled && isDesktop() && (
                <SettingsSection
                    hasVerticalLayout={hasContentBelowTabletWidth}
                    title={<Translation id="TR_EXPERIMENTAL_MCP_SERVER" />}
                    icon={PlugsIcon}
                >
                    <McpServer />
                </SettingsSection>
            )}
        </SettingsLayout>
    );
};
