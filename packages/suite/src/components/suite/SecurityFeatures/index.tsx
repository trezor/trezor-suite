import React from 'react';
import styled from 'styled-components';
import Card from '@suite-components/Card';
import { colors, Button, Icon, variables } from '@trezor/components-v2';

interface StyleProps {
    variant: 'primary' | 'secondary';
}

const Section = styled.div`
    display: flex;
    flex-direction: column;
`;

const SecurityCard = styled(Card)`
    flex-direction: column;
    width: 230px;

    & + & {
        margin-left: 20px;
    }
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

const Body = styled.div`
    display: flex;
    padding: 24px 16px;
    justify-content: center;
    align-items: center;
    flex-direction: column;
`;

const Header = styled.div<StyleProps>`
    display: flex;
    border-radius: 6px 6px 0px 0px;
    height: 68px;
    background: ${props => (props.variant === 'primary' ? '#31C102' : colors.BLACK92)};
    justify-content: center;
`;

const IconCircle = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    background: ${colors.WHITE};
    width: 55px;
    height: 55px;
    border-radius: 50%;
    padding: 5px;
    margin-top: 40px;
`;

const Title = styled.div`
    font-size: ${variables.FONT_SIZE.BODY};
    color: ${colors.BLACK0};
    text-align: center;
    margin-bottom: 8px;
`;

const Description = styled.div`
    font-size: ${variables.FONT_SIZE.TINY};
    color: ${colors.BLACK50};
    text-align: center;
`;

const Action = styled.div`
    margin-top: 18px;
`;

export interface Props extends React.HTMLAttributes<HTMLDivElement> {}

const SecurityFeatures = ({ ...rest }: Props) => {
    return (
        <Section {...rest}>
            <SectionHeader>
                <SectionTitle>Security Features (Completed 1 of 4)</SectionTitle>
            </SectionHeader>
            <Content>
                <SecurityCard {...rest}>
                    <Header variant="primary">
                        <IconCircle>
                            <Icon icon="CHECK" size={30} color={colors.GREEN} />
                        </IconCircle>
                    </Header>
                    <Body>
                        <Title>Backup seed created successfully!</Title>
                        <Description>Set strong PIN number against unauthorized access</Description>
                        <Action>
                            <Button disabled variant="tertiary" size="small">
                                Created yesterday
                            </Button>
                        </Action>
                    </Body>
                </SecurityCard>

                <SecurityCard {...rest}>
                    <Header variant="secondary">
                        <IconCircle>
                            <Icon icon="WALLET" size={30} color={colors.BLACK0} />
                        </IconCircle>
                    </Header>
                    <Body>
                        <Title>Backup seed created successfully!</Title>
                        <Description>Set strong PIN number against unauthorized access</Description>
                        <Action>
                            <Button variant="tertiary" size="small">
                                Created yesterday
                            </Button>
                        </Action>
                    </Body>
                </SecurityCard>
            </Content>
        </Section>
    );
};

export default SecurityFeatures;
