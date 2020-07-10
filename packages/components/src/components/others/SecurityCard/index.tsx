import React from 'react';
import styled, { css } from 'styled-components';
import { CardProps, Card, colors, variables, IconProps, Icon, Button } from '../../../index';

const Wrapper = styled.div``;

const StyledCard = styled(Card)`
    display: flex;
    flex-direction: column;
    min-height: 200px;
    padding: 10px;
    z-index: 9;
    transition: background-color 0.7s ease-out;
`;

const Header = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: -52px;
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

const Title = styled.div`
    color: ${colors.NEUE_TYPE_DARK_GREY};
    width: 200px;
    margin-top: 30px;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.NORMAL};
    text-align: center;
`;

const Description = styled.div`
    font-size: ${variables.FONT_SIZE.SMALL};
    color: ${colors.NEUE_TYPE_LIGHT_GREY};
    text-align: center;
    width: 200px;
    margin-top: 7px;
    margin-bottom: 14px;
`;

const PrimaryAction = styled.div`
    display: flex;
    justify-self: flex-end;
`;

const SecondaryAction = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    flex: 1;
    justify-content: center;
`;

const Line = styled.div`
    width: 100%;
    height: 2px;
    margin: 22px 0;
    border-top: 1px solid ${colors.NEUE_STROKE_GREY};
`;

export interface Props extends CardProps {
    variant: 'primary' | 'secondary' | 'disabled';
    icon: IconProps['icon'];
    heading: React.ReactNode;
    description?: React.ReactNode;
    cta?: {
        isPrimary: boolean;
        label: React.ReactNode;
        action?: () => void;
        dataTest?: string;
        isDisabled?: boolean;
    };
}

const SecurityCard = ({ variant, icon, heading, description, cta, ...rest }: Props) => (
    <Wrapper>
        <Header>
            <Circle>
                <Icon icon={icon} size={25} color={colors.NEUE_TYPE_DARK_GREY} />
            </Circle>
        </Header>
        <StyledCard noPadding {...rest}>
            <Title>{heading}</Title>
            {variant === 'primary' && <Description>{description}</Description>}
            {cta && variant === 'primary' && (
                 <SecondaryAction>
                    <Line />
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
                </SecondaryAction>
                <PrimaryAction>
                    <Button
                        fullWidth
                        variant="secondary"
                        isDisabled={cta.isDisabled}
                        onClick={cta.action}
                        {...(cta.dataTest
                            ? { 'data-test': `@dashboard/security-card/${cta.dataTest}/button` }
                            : {})}
                    >
                        {cta.label}
                    </Button>
                </PrimaryAction>
            )}
            {cta && variant !== 'primary' && (
                <SecondaryAction>
                    <Line />
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
                </SecondaryAction>
            )}
        </StyledCard>
    </Wrapper>
);

export { SecurityCard, Props as SecurityCardProps };
