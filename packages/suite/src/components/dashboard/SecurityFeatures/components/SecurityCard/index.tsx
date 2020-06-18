import React from 'react';
import styled, { css } from 'styled-components';
import Card, { Props as CardProps } from '@suite-components/Card';
import { colors, Button, Icon, variables, IconProps } from '@trezor/components';

const StyledCard = styled(Card)`
    display: flex;
    flex-direction: column;
    /* width: 230px; */
    min-height: 210px; /* so it doesn't jump when all cards are completed */
    justify-content: center;
    align-items: center;
    transition: background-color 0.7s ease-out;

    & + & {
        margin-left: 20px;
    }
`;

const Circle = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    background: ${colors.WHITE};
    width: 58px;
    height: 58px;
    border-radius: 50%;
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
    color: ${colors.BLACK0};
    text-align: center;
    margin-bottom: 8px;
    margin-top: 20px;
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};

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
    padding: 0 10px;

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
        dataTest?: string;
        isDisabled?: boolean;
    };
}

const SecurityCard = ({ variant, icon, heading, description, cta, ...rest }: Props) => {
    const cardIcon = (
        <Icon icon={icon} size={30} color={variant === 'primary' ? colors.WHITE : colors.BLACK0} />
    );

    const isLoading = variant === 'disabled';

    return (
        <StyledCard {...rest}>
            <Circle>
                {!isLoading &&
                    (variant === 'primary' ? <GreenCircle>{cardIcon}</GreenCircle> : cardIcon)}
            </Circle>
            <Title isLoading={isLoading}>{heading}</Title>
            <Description isLoading={isLoading}>{description}</Description>
            {cta && !isLoading && (
                <Action>
                    <Button
                        variant="tertiary"
                        isDisabled={cta.isDisabled}
                        onClick={cta.action}
                        icon="ARROW_RIGHT"
                        alignIcon="right"
                        {...(cta.dataTest
                            ? { 'data-test': `@dashboard/security-card/${cta.dataTest}/button` }
                            : {})}
                    >
                        {cta.label}
                    </Button>
                </Action>
            )}
        </StyledCard>
    );
};

export default SecurityCard;
