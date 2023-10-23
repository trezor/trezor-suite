import { useEffect } from 'react';
import styled from 'styled-components';
import { OnboardingStepBox, OnboardingStepBoxProps } from 'src/components/onboarding';
import { CoinGroup, TooltipSymbol, Translation } from 'src/components/suite';
import { useEnabledNetworks } from 'src/hooks/settings/useEnabledNetworks';
import { CollapsibleBox } from '@trezor/components';

const Separator = styled.hr`
    height: 1px;
    width: 100%;
    background: none;
    border: 0;
    border-top: 1px solid ${({ theme }) => theme.STROKE_GREY};
    margin-bottom: 30px;
`;

const StyledCollapsibleBox = styled(CollapsibleBox)`
    background: none;
    box-shadow: none;
    margin-top: 12px;
    width: 100%;

    ${CollapsibleBox.Header} {
        padding: 24px 12px 24px 6px;
    }
`;

const StyledCoinsGroup = styled(CoinGroup)`
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
            <CoinGroup
                networks={mainnets}
                onToggle={setEnabled}
                selectedNetworks={enabledNetworks}
            />
            <StyledCollapsibleBox
                noContentPadding
                heading={
                    <>
                        <Translation id="TR_TESTNET_COINS" />
                        <TooltipSymbol
                            content={<Translation id="TR_TESTNET_COINS_DESCRIPTION" />}
                        />
                    </>
                }
                variant="large"
            >
                <StyledCoinsGroup
                    networks={testnets}
                    onToggle={setEnabled}
                    selectedNetworks={enabledNetworks}
                />
            </StyledCollapsibleBox>
        </OnboardingStepBox>
    );
};
