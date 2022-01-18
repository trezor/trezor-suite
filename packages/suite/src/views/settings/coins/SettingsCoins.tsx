import React from 'react';
import styled from 'styled-components';
import { SettingsLayout } from '@settings-components';
import { CoinsGroup, Translation } from '@suite-components';
import { Section } from '@suite-components/Settings';
import { useEnabledNetworks } from '@settings-hooks/useEnabledNetworks';

const StyledSettingsLayout = styled(SettingsLayout)`
    & > * + * {
        margin-top: 16px;
    }
`;

const StyledCoinsGroup = styled(CoinsGroup)`
    margin-top: 18px;
    padding: 0 20px;
`;

const SettingsCoins = () => {
    const { mainnets, testnets, enabledNetworks, setEnabled } = useEnabledNetworks();

    return (
        <StyledSettingsLayout>
            <Section title={<Translation id="TR_COINS" />}>
                <StyledCoinsGroup
                    networks={mainnets}
                    onToggle={setEnabled}
                    selectedNetworks={enabledNetworks}
                />
            </Section>
            <Section title={<Translation id="TR_TESTNET_COINS" />}>
                <StyledCoinsGroup
                    networks={testnets}
                    onToggle={setEnabled}
                    selectedNetworks={enabledNetworks}
                    testnet
                />
            </Section>
        </StyledSettingsLayout>
    );
};

export default SettingsCoins;
