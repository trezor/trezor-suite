import { Context } from '@suite-common/message-system';
import { getNetwork } from '@suite-common/wallet-config';
import { selectEnabledNetworks } from '@suite-common/wallet-core';
import { isDesktop, isLinux, isWeb } from '@trezor/env-utils';

import { SettingsLayout } from 'src/components/settings/SettingsLayout';
import { SettingsSection } from 'src/components/settings/SettingsSection';
import { Translation } from 'src/components/suite/Translation';
import { ContextMessage } from 'src/components/wallet/WalletLayout/AccountBanners/ContextMessage';
import { useLayoutSize, useSelector } from 'src/hooks/suite';
import {
    selectIsMetadataEnabled,
    selectSelectedProviderForLabels,
} from 'src/reducers/suite/metadataReducer';
import {
    selectHasExperimentalFeature,
    selectIsSettingsDesktopAppPromoBannerShown,
    selectTorState,
} from 'src/selectors/suite/suiteSelectors';
import { TorStatus } from 'src/types/suite';

import { AutoEject } from './AutoEject';
import { BaseCurrency } from './BaseCurrency';
import { BioAuthSettings } from './BioAuthSettings';
import { BitcoinAmountUnit } from './BitcoinAmountUnit';
import { ClearStorage } from './ClearStorage';
import { ConnectLabelingProvider } from './ConnectLabelingProvider';
import { DesktopSuiteBanner } from './DesktopSuiteBanner';
import { DisconnectLabelingProvider } from './DisconnectLabelingProvider';
import { Labeling } from './Labeling';
import { Language } from './Language';
import { ShowApplicationLog } from './ShowApplicationLog';
import { StoreDeviceData } from './StoreDeviceData';
import { Tor } from './Tor';
import { TorExternal } from './TorExternal';
import { TorOnionLinks } from './TorOnionLinks';
import { VersionWithUpdate } from './VersionWithUpdate';

export const SettingsGeneral = () => {
    const shouldShowSettingsDesktopAppPromoBanner = useSelector(
        selectIsSettingsDesktopAppPromoBannerShown,
    );

    const { isTorEnabled } = useSelector(selectTorState);
    const torStatus = useSelector(state => state.suite.torStatus);
    const enabledNetworks = useSelector(selectEnabledNetworks);
    const isMetadataEnabled = useSelector(selectIsMetadataEnabled);
    const { isBelowTablet } = useLayoutSize();

    const hasBitcoinNetworks = enabledNetworks.some(symbol => {
        const networkFeatures = getNetwork(symbol).features;

        return networkFeatures.includes('amount-unit');
    });

    const torExternalExperimentalFeature = useSelector(
        selectHasExperimentalFeature('tor-external'),
    );

    const isProviderConnected = useSelector(selectSelectedProviderForLabels);

    return (
        <SettingsLayout data-testid="@settings/index">
            <ContextMessage context={Context.getSettings('general')} />

            <div>
                {isWeb() && !isBelowTablet && shouldShowSettingsDesktopAppPromoBanner && (
                    <DesktopSuiteBanner />
                )}

                <SettingsSection title={<Translation id="TR_LOCALIZATION" />} icon="flag">
                    <Language />
                    <BaseCurrency />
                    {hasBitcoinNetworks && <BitcoinAmountUnit />}
                </SettingsSection>
            </div>

            <SettingsSection title={<Translation id="TR_LABELING" />} icon="tag">
                <Labeling />
                {isMetadataEnabled &&
                    (isProviderConnected ? (
                        <DisconnectLabelingProvider />
                    ) : (
                        <ConnectLabelingProvider />
                    ))}
            </SettingsSection>

            <SettingsSection title={<Translation id="TR_PRIVACY" />} icon="lock">
                <AutoEject />
                <StoreDeviceData />
                {isDesktop() && !isLinux() && <BioAuthSettings />}
                {(isDesktop() || (isWeb() && isTorEnabled)) && (
                    <>
                        {isDesktop() && <Tor />}
                        {(isTorEnabled || torStatus === TorStatus.Enabling) && <TorOnionLinks />}
                        {torExternalExperimentalFeature && <TorExternal />}
                    </>
                )}
            </SettingsSection>

            <SettingsSection title={<Translation id="TR_APPLICATION" />} icon="appWindow">
                <ShowApplicationLog />
                <ClearStorage />
                <VersionWithUpdate />
            </SettingsSection>
        </SettingsLayout>
    );
};
