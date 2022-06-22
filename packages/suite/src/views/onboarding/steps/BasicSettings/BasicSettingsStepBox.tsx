import React, { useEffect } from 'react';
import styled from 'styled-components';
import { OnboardingStepBox, OnboardingStepBoxProps } from '@onboarding-components';
import { CoinsGroup } from '@suite-components';
import { useEnabledNetworks } from '@settings-hooks/useEnabledNetworks';

const Separator = styled.hr`
    height: 1px;
    width: 100%;
    background: none;
    border: 0;
    border-top: 1px solid ${props => props.theme.STROKE_GREY};
`;

const StyledCoinsGroup = styled(CoinsGroup)`
    margin-top: 30px;
`;

export const BasicSettingsStepBox = (props: OnboardingStepBoxProps) => {
    const { mainnets, testnets, enabledNetworks, setEnabled } = useEnabledNetworks();

    // BTC should be enabled by default
    useEffect(() => {
        setEnabled('btc', true);
    }, [setEnabled]);

    return (
        <OnboardingStepBox image="COINS" {...props}>
            <Separator />
            <StyledCoinsGroup
                networks={mainnets}
                onToggle={setEnabled}
                selectedNetworks={enabledNetworks}
            />
            <StyledCoinsGroup
                networks={testnets}
                onToggle={setEnabled}
                selectedNetworks={enabledNetworks}
                testnet
            />
        </OnboardingStepBox>
    );
};
