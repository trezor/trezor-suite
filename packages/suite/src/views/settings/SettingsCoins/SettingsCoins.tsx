import styled from 'styled-components';
import { hasBitcoinOnlyFirmware, isBitcoinOnlyDevice } from '@trezor/device-utils';
import { selectDeviceSupportedNetworks } from '@suite-common/wallet-core';

import { DeviceBanner, SettingsLayout, SettingsSection } from 'src/components/settings';
import { CoinGroup, SectionItem, TooltipSymbol, Translation } from 'src/components/suite';
import { useEnabledNetworks } from 'src/hooks/settings/useEnabledNetworks';
import { useAnchor } from 'src/hooks/suite/useAnchor';
import { SettingsAnchor } from 'src/constants/suite/anchors';
import { useDevice, useSelector } from 'src/hooks/suite';

import { FirmwareTypeSuggestion } from './FirmwareTypeSuggestion';
import { selectSuiteFlags } from '../../../reducers/suite/suiteReducer';

const StyledSettingsSection = styled(SettingsSection)`
    overflow: hidden;
`;

const StyledSectionItem = styled(SectionItem)`
    > div {
        flex-direction: column;
    }
`;

export const SettingsCoins = () => {
    const { firmwareTypeBannerClosed } = useSelector(selectSuiteFlags);

    const { mainnets, testnets, enabledNetworks, setEnabled } = useEnabledNetworks();
    const deviceSupportedNetworks = useSelector(selectDeviceSupportedNetworks);
    const supportedEnabledNetworks = enabledNetworks.filter(enabledNetwork =>
        deviceSupportedNetworks.includes(enabledNetwork),
    );

    const { anchorRef: anchorRefCrypto, shouldHighlight: shouldHighlightCrypto } = useAnchor(
        SettingsAnchor.Crypto,
    );
    const { anchorRef: anchorRefTestnetCrypto, shouldHighlight: shouldHighlightTestnetCrypto } =
        useAnchor(SettingsAnchor.TestnetCrypto);

    const { device } = useDevice();

    const bitcoinOnlyFirmware = hasBitcoinOnlyFirmware(device);
    const bitcoinNetworks = ['btc', 'test', 'regtest'];

    const onlyBitcoinNetworksEnabled =
        !!supportedEnabledNetworks.length &&
        supportedEnabledNetworks.every(coin => bitcoinNetworks.includes(coin));
    const bitcoinOnlyDevice = isBitcoinOnlyDevice(device);

    const showDeviceBanner = device?.connected === false; // device is remembered and disconnected

    const showFirmwareTypeBanner =
        !firmwareTypeBannerClosed &&
        device &&
        !bitcoinOnlyDevice &&
        (bitcoinOnlyFirmware || (!bitcoinOnlyFirmware && onlyBitcoinNetworksEnabled));

    return (
        <SettingsLayout>
            {showDeviceBanner && (
                <DeviceBanner
                    title={
                        <Translation id="TR_SETTINGS_COINS_BANNER_DESCRIPTION_REMEMBERED_DISCONNECTED" />
                    }
                />
            )}

            {showFirmwareTypeBanner && <FirmwareTypeSuggestion />}

            <StyledSettingsSection title={<Translation id="TR_COINS" />} icon="COIN">
                <StyledSectionItem ref={anchorRefCrypto} shouldHighlight={shouldHighlightCrypto}>
                    <CoinGroup
                        networks={mainnets}
                        onToggle={setEnabled}
                        selectedNetworks={enabledNetworks}
                    />
                </StyledSectionItem>
            </StyledSettingsSection>

            <SettingsSection
                title={
                    <>
                        <Translation id="TR_TESTNET_COINS" />{' '}
                        <TooltipSymbol
                            content={<Translation id="TR_TESTNET_COINS_DESCRIPTION" />}
                        />
                    </>
                }
                icon="COIN"
            >
                <SectionItem
                    ref={anchorRefTestnetCrypto}
                    shouldHighlight={shouldHighlightTestnetCrypto}
                >
                    <CoinGroup
                        networks={testnets}
                        onToggle={setEnabled}
                        selectedNetworks={enabledNetworks}
                    />
                </SectionItem>
            </SettingsSection>
        </SettingsLayout>
    );
};
