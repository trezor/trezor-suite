import React from 'react';
import styled, { css } from 'styled-components';
import Card, { Props as CardProps } from '@suite-components/Card';
import { colors, Button, Icon, variables, IconProps } from '@trezor/components-v2';

const StyledCard = styled(Card)`
    flex-direction: column;
    width: 230px;

    & + & {
        margin-left: 20px;
    }
`;

const Body = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
    align-items: center;
    padding: 40px 16px 24px 16px;
    min-height: 160px;
`;

const Header = styled.div<Pick<Props, 'variant'>>`
    display: flex;
    border-radius: 6px 6px 0px 0px;
    height: 68px;
    background: ${props => (props.variant === 'primary' ? '#31C102' : colors.BLACK92)};
    justify-content: center;
    transition: background-color 0.7s ease-out;
`;

const Circle = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    background: ${colors.WHITE};
    width: 58px;
    height: 58px;
    border-radius: 50%;
    margin-top: 40px;
    transition: background-color 0.7s ease-out;
`;

const GreenCircle = styled(Circle)`
    background: ${colors.GREEN};
    margin-top: 0px;
    width: 48px;
    height: 48px;
    padding: 5px;
`;

const Title = styled.div<{ isLoading: boolean }>`
    font-size: ${variables.FONT_SIZE.BODY};
    color: ${colors.BLACK0};
    text-align: center;
    margin-bottom: 8px;
    ${props =>
        props.isLoading &&
        css`
            background: ${colors.BLACK0};
            opacity: 0.1;
        `};
`;

/* flex: 1 fill the space so the action button is pushed at the bottom of the card */
const Description = styled.div<{ isLoading: boolean }>`
    font-size: ${variables.FONT_SIZE.TINY};
    color: ${colors.BLACK50};
    text-align: center;
    flex: 1;
    ${props =>
        props.isLoading &&
        css`
            background: ${colors.BLACK50};
            opacity: 0.1;
        `};
`;

const Action = styled.div`
    margin-top: 18px;
    display: flex;
    justify-self: flex-end;
`;

export interface Props extends CardProps {
    variant: 'primary' | 'secondary' | 'disabled';
    icon: IconProps['icon'];
    heading: React.ReactNode;
    description?: React.ReactNode;
    cta?: {
        label: React.ReactNode;
        action?: () => void;
    };
    'data-test'?: string;
}

const SecurityCard = ({ variant, icon, heading, description, cta, ...rest }: Props) => {
    const cardIcon = (
        <Icon icon={icon} size={30} color={variant === 'primary' ? colors.WHITE : colors.BLACK0} />
    );
    const isLoading = variant === 'disabled';

    return (
        <StyledCard {...rest}>
            <Header variant={variant}>
                <Circle>
                    {!isLoading &&
                        (variant === 'primary' ? <GreenCircle>{cardIcon}</GreenCircle> : cardIcon)}
                </Circle>
            </Header>
            <Body>
                <Title isLoading={isLoading}>{heading}</Title>
                <Description isLoading={isLoading}>{description}</Description>
                {cta && !isLoading && (
                    <Action>
                        <Button
                            data-test={`@dashboard/security-card/${rest['data-test']}/button`}
                            variant="tertiary"
                            size="small"
                            onClick={cta.action}
                            {...(variant === 'secondary'
                                ? { icon: 'ARROW_RIGHT', alignIcon: 'right' }
                                : {})}
                        >
                            {cta.label}
                        </Button>
                    </Action>
                )}
            </Body>
        </StyledCard>
    );
};

export default SecurityCard;
