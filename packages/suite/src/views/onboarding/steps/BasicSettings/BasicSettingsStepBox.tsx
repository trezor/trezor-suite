import { useEffect } from 'react';
import styled from 'styled-components';
import { OnboardingStepBox, OnboardingStepBoxProps } from 'src/components/onboarding';
import { CoinGroup, TooltipSymbol, Translation } from 'src/components/suite';
import { useEnabledNetworks } from 'src/hooks/settings/useEnabledNetworks';
import { CollapsibleBox } from '@trezor/components';
import { spacings } from '@trezor/theme';

const Separator = styled.hr`
    height: 1px;
    width: 100%;
    background: none;
    border: 0;
    border-top: 1px solid ${({ theme }) => theme.STROKE_GREY};
    margin-bottom: 30px;
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
            <CoinGroup
                networks={mainnets}
                onToggle={setEnabled}
                selectedNetworks={enabledNetworks}
            />
            <CollapsibleBox
                margin={{ top: spacings.xl }}
                heading={
                    <>
                        <Translation id="TR_TESTNET_COINS" />
                        <TooltipSymbol
                            content={<Translation id="TR_TESTNET_COINS_DESCRIPTION" />}
                        />
                    </>
                }
                paddingType="large"
            >
                <CoinGroup
                    networks={testnets}
                    onToggle={setEnabled}
                    selectedNetworks={enabledNetworks}
                />
            </CollapsibleBox>
        </OnboardingStepBox>
    );
};
