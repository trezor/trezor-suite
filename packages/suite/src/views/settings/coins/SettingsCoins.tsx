import React from 'react';
import styled from 'styled-components';

import { SettingsLayout } from '@settings-components';
import { CoinsGroup, Translation } from '@suite-components';
import { DeviceBanner, SettingsSection, SectionItem } from '@suite-components/Settings';
import { useEnabledNetworks } from '@settings-hooks/useEnabledNetworks';
import { useAnchor } from '@suite-hooks/useAnchor';
import { SettingsAnchor } from '@suite-constants/anchors';
import { useDevice, useSelector } from '@suite-hooks';
import { isBitcoinOnly } from '@suite-utils/device';
import { FirmwareTypeSuggestion } from './FirmwareTypeSuggestion';

const StyledSettingsLayout = styled(SettingsLayout)`
    & > * + * {
        margin-top: 16px;
    }
`;

export const SettingsCoins = () => {
    const { firmwareTypeBannerClosed } = useSelector(state => state.suite.flags);

    const { mainnets, testnets, enabledNetworks, setEnabled } = useEnabledNetworks();

    const { anchorRef: anchorRefCrypto, shouldHighlight: shouldHighlightCrypto } = useAnchor(
        SettingsAnchor.Crypto,
    );
    const { anchorRef: anchorRefTestnetCrypto, shouldHighlight: shouldHighlightTestnetCrypto } =
        useAnchor(SettingsAnchor.TestnetCrypto);

    const { device } = useDevice();

    const bitcoinOnlyFirmware = device && isBitcoinOnly(device);
    const onlyBitcoinEnabled = enabledNetworks.every(coin =>
        ['btc', 'regtest', 'test'].includes(coin),
    );
    const showDeviceBanner = device?.connected === false; // device is remembered and disconnected
    const showFirmwareTypeBanner =
        !firmwareTypeBannerClosed &&
        device &&
        (bitcoinOnlyFirmware || (!bitcoinOnlyFirmware && onlyBitcoinEnabled));

    return (
        <StyledSettingsLayout>
            {showDeviceBanner && (
                <DeviceBanner
                    title={
                        <Translation id="TR_SETTINGS_COINS_BANNER_DESCRIPTION_REMEMBERED_DISCONNECTED" />
                    }
                />
            )}
            {showFirmwareTypeBanner && <FirmwareTypeSuggestion />}
            <SettingsSection title={<Translation id="TR_COINS" />} icon="COIN">
                <SectionItem ref={anchorRefCrypto} shouldHighlight={shouldHighlightCrypto}>
                    <CoinsGroup
                        networks={mainnets}
                        onToggle={setEnabled}
                        selectedNetworks={enabledNetworks}
                    />
                </SectionItem>
            </SettingsSection>

            <SettingsSection title={<Translation id="TR_TESTNET_COINS" />} icon="COIN">
                <SectionItem
                    ref={anchorRefTestnetCrypto}
                    shouldHighlight={shouldHighlightTestnetCrypto}
                >
                    <CoinsGroup
                        networks={testnets}
                        onToggle={setEnabled}
                        selectedNetworks={enabledNetworks}
                        testnet
                    />
                </SectionItem>
            </SettingsSection>
        </StyledSettingsLayout>
    );
};
