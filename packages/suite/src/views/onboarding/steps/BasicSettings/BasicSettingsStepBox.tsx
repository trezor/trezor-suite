import { useEffect } from 'react';
import styled from 'styled-components';
import { OnboardingStepBox, OnboardingStepBoxProps } from 'src/components/onboarding';
import { CoinGroup, TooltipSymbol, Translation } from 'src/components/suite';
import { useEnabledNetworks } from 'src/hooks/settings/useEnabledNetworks';
import { CollapsibleBox } from '@trezor/components';
import { spacings } from '@trezor/theme';
import { selectDeviceModel } from '@suite-common/wallet-core';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { DeviceModelInternal } from '@trezor/connect';
import { changeCoinVisibility } from 'src/actions/settings/walletSettingsActions';

const Separator = styled.hr`
    height: 1px;
    width: 100%;
    background: none;
    border: 0;
    border-top: 1px solid ${({ theme }) => theme.legacy.STROKE_GREY};
    margin-bottom: 30px;
`;

export const BasicSettingsStepBox = (props: OnboardingStepBoxProps) => {
    const { supportedMainnets, unsupportedMainnets, supportedTestnets, enabledNetworks } =
        useEnabledNetworks();
    const deviceModel = useSelector(selectDeviceModel);
    const dispatch = useDispatch();

    // BTC should be enabled by default
    useEffect(() => {
        dispatch(changeCoinVisibility('btc', true));
    }, [dispatch]);

    return (
        <OnboardingStepBox image="COINS" {...props}>
            <Separator />
            <CoinGroup networks={supportedMainnets} enabledNetworks={enabledNetworks} />
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
                <CoinGroup networks={supportedTestnets} enabledNetworks={enabledNetworks} />
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
                    <CoinGroup networks={unsupportedMainnets} enabledNetworks={enabledNetworks} />
                </CollapsibleBox>
            )}
        </OnboardingStepBox>
    );
};
