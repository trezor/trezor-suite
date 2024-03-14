import { Card, Text } from '@trezor/components';
import { Translation } from '../../components/suite';
import styled from 'styled-components';
import { spacingsPx } from '@trezor/theme';
import { breakpointMediaQueries } from '@trezor/styles';
import { PriceChartLine } from './PriceChartLine';
import { DeviceStatusWithLabel } from '../../components/suite/layouts/SuiteLayout/DeviceSelector/DeviceStatusWithLabel';

const StyledCard = styled(Card)`
    display: flex;
    flex-direction: column;
    gap: ${spacingsPx.md};

    ${breakpointMediaQueries.below_sm} {
    }
`;

const WindowWithChart = styled.div``;

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
                }} />
        </Text>

        <Translation id="TR_REMEMBER_CARD_EXPLANATION" />
    </StyledCard>
);
