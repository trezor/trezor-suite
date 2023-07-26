import React from 'react';
import styled from 'styled-components';

import { SettingsLayout } from 'src/components/settings';
import { CoinsGroup, TooltipSymbol, Translation } from 'src/components/suite';
import { DeviceBanner, SettingsSection, SectionItem } from 'src/components/suite/Settings';
import { useEnabledNetworks } from 'src/hooks/settings/useEnabledNetworks';
import { useAnchor } from 'src/hooks/suite/useAnchor';
import { SettingsAnchor } from 'src/constants/suite/anchors';
import { useDevice, useSelector } from 'src/hooks/suite';
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

    const bitcoinOnlyFirmware = device?.firmwareType === 'bitcoin-only';
    const onlyBitcoinEnabled =
        !!enabledNetworks.length &&
        enabledNetworks.every(coin => ['btc', 'regtest', 'test'].includes(coin));
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
                    <CoinsGroup
                        networks={testnets}
                        onToggle={setEnabled}
                        selectedNetworks={enabledNetworks}
                    />
                </SectionItem>
            </SettingsSection>
        </StyledSettingsLayout>
    );
};
