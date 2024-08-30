import { useEffect } from 'react';
import styled from 'styled-components';
import { OnboardingStepBox, OnboardingStepBoxProps } from 'src/components/onboarding';
import { CoinGroup, TooltipSymbol, Translation } from 'src/components/suite';
import { useEnabledNetworks } from 'src/hooks/settings/useEnabledNetworks';
import { CollapsibleBox } from '@trezor/components';
import { spacings } from '@trezor/theme';
import { selectDeviceSupportedNetworks, selectDeviceModel } from '@suite-common/wallet-core';
import { useSelector } from 'src/hooks/suite';
import { DeviceModelInternal } from '@trezor/connect';
import { NetworkCompatible } from '@suite-common/wallet-config';

const Separator = styled.hr`
    height: 1px;
    width: 100%;
    background: none;
    border: 0;
    border-top: 1px solid ${({ theme }) => theme.legacy.STROKE_GREY};
    margin-bottom: 30px;
`;

export const BasicSettingsStepBox = (props: OnboardingStepBoxProps) => {
    const { mainnets, testnets, enabledNetworks, setEnabled } = useEnabledNetworks();
    const deviceSupportedNetworkSymbols = useSelector(selectDeviceSupportedNetworks);
    const deviceModel = useSelector(selectDeviceModel);

    const getNetworks = (networks: NetworkCompatible[], getUnsupported = false) =>
        networks.filter(
            ({ symbol }) => getUnsupported !== deviceSupportedNetworkSymbols.includes(symbol),
        );

    const supportedNetworks = getNetworks(mainnets);
    const unsupportedNetworks = getNetworks(mainnets, true);
    const supportedTestnetNetworks = getNetworks(testnets);

    // BTC should be enabled by default
    useEffect(() => {
        setEnabled('btc', true);
    }, [setEnabled]);

    return (
        <OnboardingStepBox image="COINS" {...props}>
            <Separator />
            <CoinGroup
                networks={supportedNetworks}
                onToggle={setEnabled}
                enabledNetworks={enabledNetworks}
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
                    networks={supportedTestnetNetworks}
                    onToggle={setEnabled}
                    enabledNetworks={enabledNetworks}
                />
            </CollapsibleBox>
            {deviceModel === DeviceModelInternal.T1B1 && (
                <CollapsibleBox
                    margin={{ top: spacings.xl }}
                    heading={
                        <>
                            <Translation id="TR_UNSUPPORTED_COINS" />
                            <TooltipSymbol
                                content={<Translation id="TR_UNSUPPORTED_COINS_DESCRIPTION" />}
                            />
                        </>
                    }
                    paddingType="large"
                >
                    <CoinGroup
                        networks={unsupportedNetworks}
                        onToggle={setEnabled}
                        enabledNetworks={enabledNetworks}
                    />
                </CollapsibleBox>
            )}
        </OnboardingStepBox>
    );
};
