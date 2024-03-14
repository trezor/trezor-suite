import { Card, Icon, Text, useElevation } from '@trezor/components';
import { Translation } from '../../components/suite';
import styled from 'styled-components';
import { Elevation, mapElevationToBackground, spacings, spacingsPx } from '@trezor/theme';
import { breakpointMediaQueries } from '@trezor/styles';
import { PriceChartLine } from './PriceChartLine';
import { DeviceStatusWithLabel } from '../../components/suite/layouts/SuiteLayout/DeviceSelector/DeviceStatusWithLabel';
import { ReactNode } from 'react';

const StyledCard = styled(Card)`
    display: flex;
    flex-direction: column;
    gap: ${spacingsPx.md};

    ${breakpointMediaQueries.below_sm} {
    }
`;

const WindowWithChart = styled.div``;

const Callout = styled.div`
    display: flex;
    flex-direction: row;
    gap: ${spacingsPx.sm};
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

export const RememberWalletCard = () => (
    <StyledCard>
        <WindowWithChart>
            <DeviceStatusWithLabel />

            <PriceChartLine />
        </WindowWithChart>

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
            <Text>
                <Translation id="TR_REMEMBER_CARD_EXPLANATION" />
            </Text>
        </Callout>
    </StyledCard>
);
