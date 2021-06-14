import React, { useEffect } from 'react';
import * as walletSettingsActions from '@settings-actions/walletSettingsActions';
import { useActions } from '@suite-hooks';
import { OnboardingStepBox, OnboardingStepBoxProps } from '@onboarding-components';
import { CoinsGroup } from '@suite-components';
import styled from 'styled-components';
import { Network } from '@wallet-types';
import { UnavailableCapability } from 'trezor-connect';

const Separator = styled.hr`
    height: 1px;
    width: 100%;
    background: none;
    border: 0;
    border-top: 1px solid ${props => props.theme.STROKE_GREY};
`;

interface Props extends OnboardingStepBoxProps {
    testnetNetworks: Network[];
    mainnetNetworks: Network[];
    enabledTestnetNetworks: Network['symbol'][];
    enabledMainnetNetworks: Network['symbol'][];
    unavailableCapabilities: { [key: string]: UnavailableCapability };
}

const BasicSettingsStepBox = ({
    testnetNetworks,
    mainnetNetworks,
    enabledTestnetNetworks,
    enabledMainnetNetworks,
    unavailableCapabilities,
    ...props
}: Props) => {
    const { changeCoinVisibility } = useActions({
        changeCoinVisibility: walletSettingsActions.changeCoinVisibility,
        changeNetworks: walletSettingsActions.changeNetworks,
    });

    // BTC should be enabled by default
    useEffect(() => {
        changeCoinVisibility('btc', true);
    }, [changeCoinVisibility]);

    return (
        <OnboardingStepBox image="COINS" {...props}>
            <Separator />
            <CoinsGroup
                onToggleFn={changeCoinVisibility}
                networks={mainnetNetworks}
                enabledNetworks={enabledMainnetNetworks}
                testnet={false}
                unavailableCapabilities={unavailableCapabilities}
            />
            <CoinsGroup
                onToggleFn={changeCoinVisibility}
                networks={testnetNetworks}
                enabledNetworks={enabledTestnetNetworks}
                testnet
                unavailableCapabilities={unavailableCapabilities}
            />
        </OnboardingStepBox>
    );
};

export default BasicSettingsStepBox;
