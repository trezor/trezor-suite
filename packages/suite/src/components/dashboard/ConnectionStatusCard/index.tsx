import React from 'react';
import styled from 'styled-components';
import { colors, variables } from '@trezor/components-v2';
import { Card, Translation } from '@suite-components';
import messages from '@suite/support/messages';

const StyledCard = styled(Card)`
    flex-direction: column;
    padding: 16px 20px;
    min-width: 280px;
`;

const Section = styled.div`
    display: flex;
    flex-direction: column;
`;

const Content = styled.div`
    display: flex;
`;

const SectionHeader = styled.div`
    display: flex;
    padding: 12px 0px;
    flex-direction: row;
`;

const SectionTitle = styled.div`
    flex: 1;
    font-size: 12px;
    margin-bottom: 2px;
    font-weight: 600;
    text-transform: uppercase;
    color: ${colors.BLACK50};
`;

const Service = styled.div`
    display: flex;
    flex-direction: column;

    & + & {
        margin-top: 12px;
    }
`;

const ServiceStatusWrapper = styled.div<{ color: string }>`
    display: flex;
    color: ${props => props.color};
    font-size: ${variables.FONT_SIZE.TINY};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    align-items: center;
`;

const ServiceName = styled.div`
    font-size: ${variables.FONT_SIZE.SMALL};
`;

const Status = styled.div``;
const Dot = styled.div<{ color: string }>`
    display: flex;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: ${props => props.color};
    margin-right: 3px;
`;

export type Props = React.HTMLAttributes<HTMLDivElement>;

const services = [
    {
        name: 'TODO: Show real data',
        status: 'online',
    },
    {
        name: 'Trezor Backend Servers',
        status: 'online',
    },
    {
        name: 'Tor',
        status: 'connecting',
    },
    {
        name: 'Dropbox',
        status: 'offline',
    },
] as const;

const CONNECTION_STATUS_COLORS = {
    online: colors.GREEN,
    connecting: colors.BLACK70,
    offline: colors.RED,
};

const CONNECTION_STATUS_NAMES = {
    online: <Translation {...messages.TR_ONLINE} />,
    connecting: <Translation {...messages.TR_CONNECTING_DOTDOTDOT} />,
    offline: <Translation {...messages.TR_OFFLINE} />,
};

const ConnectionStatusCard = ({ ...rest }: Props) => {
    return (
        <Section {...rest}>
            <SectionHeader>
                <SectionTitle>
                    <Translation {...messages.TR_CONNECTION_STATUS} />
                </SectionTitle>
            </SectionHeader>
            <Content>
                <StyledCard>
                    {services.map(service => (
                        <Service key={service.name}>
                            <ServiceName>{service.name}</ServiceName>
                            <ServiceStatusWrapper color={CONNECTION_STATUS_COLORS[service.status]}>
                                <Dot color={CONNECTION_STATUS_COLORS[service.status]} />
                                <Status>{CONNECTION_STATUS_NAMES[service.status]}</Status>
                            </ServiceStatusWrapper>
                        </Service>
                    ))}
                </StyledCard>
            </Content>
        </Section>
    );
};

export default ConnectionStatusCard;
