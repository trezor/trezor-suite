import { Button, Card, Icon, Image, Text, useElevation } from '@trezor/components';
import { FormattedCryptoAmount, Translation } from '../../components/suite';
import styled from 'styled-components';
import { Elevation, borders, mapElevationToBackground, spacings, spacingsPx } from '@trezor/theme';
import { breakpointMediaQueries } from '@trezor/styles';
import { PriceChartLine } from './PriceChartLine';
import { ReactNode } from 'react';
import { DeviceConnectionText } from '../suite/SwitchDevice/DeviceItem/DeviceConnectionText';
import { DeviceDetail } from '../suite/SwitchDevice/DeviceItem/DeviceDetail';
import { MacWindow } from './MacWindow';

const StyledCard = styled(Card)`
    display: flex;
    flex-direction: column;
    gap: ${spacingsPx.md};
    padding: ${spacingsPx.xxs};
    width: 476px;

    ${breakpointMediaQueries.below_sm} {
    }
`;

const Callout = styled.div`
    display: flex;
    flex-direction: row;
    gap: ${spacingsPx.sm};
    align-items: center;
`;

const StyledCircle = styled.div<{ $elevation: Elevation }>`
    border-radius: 100%;
    cursor: pointer;
    background: ${mapElevationToBackground};
    width: 42px;
    height: 42px;
    display: flex;
    align-items: center;
    justify-content: center;
`;

const Circle = ({ children }: { children: ReactNode }) => {
    const { elevation } = useElevation();

    return <StyledCircle $elevation={elevation}>{children}</StyledCircle>;
};

const SmallDeviceImage = styled(Image)`
    width: 18px;
`;

const LargeDeviceImage = styled(Image)`
    width: 93px;
`;

const DeviceItem = styled.div`
    display: flex;
    flex-direction: row;
    gap: ${spacingsPx.xs};
    padding: ${spacingsPx.xs};
    align-items: center;
`;

const WindowGrayTop = styled.div`
    margin: ${spacingsPx.xxs};
    background-color: ${({ theme }) => theme.backgroundNeutralSubtleOnElevation1};
    border-radius: ${borders.radii.xxs};
`;

const WindowChart = styled.div``;

const Top = styled.div`
    display: flex;
    flex-direction: row;
    background-color: ${({ theme }) => theme.backgroundNeutralSubtleOnElevation1};
    height: 196px;
    border-radius: ${borders.radii.sm};
    padding-top: ${spacingsPx.sm};
    padding-left: ${spacingsPx.lg};
    gap: ${spacingsPx.xxxxl};
`;

const Bottom = styled.div`
    display: flex;
    flex-direction: column;
    padding: ${spacingsPx.xxl} ${spacingsPx.lg} ${spacingsPx.lg} ${spacingsPx.lg};
    gap: ${spacingsPx.xxl};
`;

const ChartText = styled.div`
    display: flex;
    flex-direction: column;
    margin: ${spacingsPx.xs};
`;

const Buttons = styled.div`
    display: flex;
    gap: ${spacingsPx.sm};
    width: : 100%;
`;

export const RememberWalletCard = () => (
    <StyledCard>
        <Top>
            <MacWindow>
                <WindowGrayTop>
                    <DeviceItem>
                        <SmallDeviceImage alt="Trezor" image={`TREZOR_T2T1`} />

                        <DeviceDetail label="My Trezor">
                            <DeviceConnectionText icon="LINK" variant="primary">
                                <Translation id="TR_CONNECTED" />
                            </DeviceConnectionText>
                        </DeviceDetail>
                    </DeviceItem>
                </WindowGrayTop>
                <WindowChart>
                    <ChartText>
                        <Text variant="primary" typographyStyle="label">
                            <Translation id="TR_BALANCE" />
                        </Text>
                        <FormattedCryptoAmount value={'0.04223123'} symbol={'BTC'} />
                    </ChartText>
                    <PriceChartLine />
                </WindowChart>
            </MacWindow>
            <LargeDeviceImage alt="Trezor" image={`TREZOR_T2T1`} />
        </Top>
        <Bottom>
            <Text typographyStyle="titleSmall">
                <Translation
                    id="TR_REMEMBER_CARD_CALL_TO_ACTION"
                    values={{
                        primary: chunks => (
                            <>
                                <br />
                                <Text variant="primary">{chunks}</Text>
                            </>
                        ),
                    }}
                />
            </Text>

            <Callout>
                <Circle>
                    <Icon icon="LINK" size={spacings.xl} />
                </Circle>
                <Text variant="subdued">
                    <Translation
                        id="TR_REMEMBER_CARD_EXPLANATION"
                        values={{
                            secondLine: chunks => (
                                <>
                                    <br />
                                    {chunks}
                                </>
                            ),
                        }}
                    />
                </Text>
            </Callout>
            <Buttons>
                <Button variant="primary" isFullWidth>
                    <Translation id="TR_MODAL_REMEMBER_WALLET_YES" />
                </Button>
                <Button variant="tertiary" isFullWidth>
                    <Translation id="TR_MODAL_REMEMBER_WALLET_NOT_NOW" />
                </Button>
            </Buttons>
        </Bottom>
    </StyledCard>
);
