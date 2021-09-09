import React, { useEffect } from 'react';
import * as walletSettingsActions from '@settings-actions/walletSettingsActions';
import { useActions } from '@suite-hooks';
import { OnboardingStepBox, OnboardingStepBoxProps } from '@onboarding-components';
import { CoinsGroup } from '@suite-components';
import styled from 'styled-components';
import { Network } from '@wallet-types';

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
}

const BasicSettingsStepBox = ({
    testnetNetworks,
    mainnetNetworks,
    enabledTestnetNetworks,
    enabledMainnetNetworks,
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
            />
            <CoinsGroup
                onToggleFn={changeCoinVisibility}
                networks={testnetNetworks}
                enabledNetworks={enabledTestnetNetworks}
                testnet
            />
        </OnboardingStepBox>
    );
};

export default BasicSettingsStepBox;
