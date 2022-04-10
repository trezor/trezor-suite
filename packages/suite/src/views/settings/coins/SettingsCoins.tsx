import React from 'react';
import styled from 'styled-components';
import { SettingsLayout } from '@settings-components';
import { CoinsGroup, Translation } from '@suite-components';
import { SettingsSection, SectionItem, DeviceBanner } from '@suite-components/Settings';
import { useEnabledNetworks } from '@settings-hooks/useEnabledNetworks';
import { useAnchor } from '@suite-hooks/useAnchor';
import { useDevice } from '@suite-hooks';
import { SettingsAnchor } from '@suite-constants/anchors';

const StyledSettingsLayout = styled(SettingsLayout)`
    & > * + * {
        margin-top: 16px;
    }
`;

export const SettingsCoins = () => {
    const { mainnets, testnets, enabledNetworks, setEnabled } = useEnabledNetworks();

    const { anchorRef: anchorRefCrypto, shouldHighlight: shouldHighlightCrypto } = useAnchor(
        SettingsAnchor.Crypto,
    );
    const { anchorRef: anchorRefTestnetCrypto, shouldHighlight: shouldHighlightTestnetCrypto } =
        useAnchor(SettingsAnchor.TestnetCrypto);

    const { device } = useDevice();

    return (
        <StyledSettingsLayout>
            {device?.connected === false && (
                <DeviceBanner
                    title={
                        <Translation id="TR_SETTINGS_COINS_BANNER_TITLE_REMEMBERED_DISCONNECTED" />
                    }
                    description={
                        <Translation id="TR_SETTINGS_COINS_BANNER_DESCRIPTION_REMEMBERED_DISCONNECTED" />
                    }
                />
            )}
            <SettingsSection title={<Translation id="TR_COINS" />}>
                <SectionItem ref={anchorRefCrypto} shouldHighlight={shouldHighlightCrypto}>
                    <CoinsGroup
                        networks={mainnets}
                        onToggle={setEnabled}
                        selectedNetworks={enabledNetworks}
                    />
                </SectionItem>
            </SettingsSection>
            <SettingsSection title={<Translation id="TR_TESTNET_COINS" />}>
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
