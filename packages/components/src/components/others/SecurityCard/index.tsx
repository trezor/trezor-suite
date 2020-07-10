import React from 'react';
import styled, { css } from 'styled-components';
import { CardProps, Card, colors, variables, IconProps, Icon, Button } from '../../../index';

const Wrapper = styled.div``;

const StyledCard = styled(Card)`
    display: flex;
    flex-direction: column;
    min-height: 186px;
    z-index: 9;
    justify-content: center;
    align-items: center;
    transition: background-color 0.7s ease-out;
`;

const Header = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: -58px;
`;

const Circle = styled.div`
    z-index: 10;
    border: 1px solid ${colors.NEUE_STROKE_GREY};
    background: ${colors.WHITE};
    width: 58px;
    height: 58px;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    transition: background-color 0.7s ease-out;
`;

const Title = styled.div<{ isLoading: boolean }>`
    color: ${colors.NEUE_TYPE_DARK_GREY};
    width: 200px;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.NORMAL};
    text-align: center;

    ${props =>
        props.isLoading &&
        css`
            background: ${colors.BLACK50};
            opacity: 0.1;
        `};
`;

const Description = styled.div<{ isLoading: boolean }>`
    font-size: ${variables.FONT_SIZE.SMALL};
    color: ${colors.NEUE_TYPE_LIGHT_GREY};
    text-align: center;
    width: 200px;
    margin-top: 7px;
    margin-bottom: 14px;

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
    const isLoading = variant === 'disabled';

    return (
        <Wrapper>
            <Header>
                <Circle>
                    <Icon
                        icon={icon}
                        size={30}
                        color={variant === 'primary' ? colors.WHITE : colors.BLACK0}
                    />
                </Circle>
            </Header>
            <StyledCard {...rest}>
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
        </Wrapper>
    );
};

export { SecurityCard, Props as SecurityCardProps };
