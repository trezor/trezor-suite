import React from 'react';
import { SuiteThemeColors } from 'src/support/types';
import styled from 'styled-components';
import { CardProps, Card } from '../Card';
import { IconProps, Icon } from '../../Icon';
import { Button } from '../../buttons/Button';
import { useTheme } from '../../../utils/hooks';
import * as variables from '../../../config/variables';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
`;

const StyledCard = styled(Card)`
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 10px;
    flex: 1;
    transition: background-color 0.7s ease-out;
`;

const Header = styled.div`
    display: flex;
    width: 100%;
    min-height: 60px;
    margin-bottom: -30px;
    justify-content: center;
`;

const Circle = styled.div`
    border: 1px solid ${props => props.theme.STROKE_GREY};
    background: ${props => props.theme.BG_WHITE};
    width: 58px;
    height: 58px;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    transition: background-color 0.7s ease-out;
    position: relative;
`;

const Title = styled.div`
    color: ${props => props.theme.TYPE_DARK_GREY};
    width: 200px;
    margin-top: 30px;
    min-height: 44px;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.NORMAL};
    text-align: center;
`;

const Description = styled.div`
    font-size: ${variables.FONT_SIZE.SMALL};
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    text-align: center;
    width: 200px;
    margin-top: 7px;
    margin-bottom: 14px;
`;

const Footer = styled.div`
    display: flex;
    width: 100%;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    margin-top: auto;
`;

const Action = styled.div`
    display: flex;
    width: 100%;
    height: 40px;
    align-items: center;
    justify-content: center;
`;

const CheckIconWrapper = styled.div`
    position: absolute;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 50%;
    width: 16px;
    height: 16px;
    top: 10px;
    right: 8px;
    background: ${props => props.theme.BG_GREEN};
`;

const Line = styled.div`
    display: flex;
    width: 100%;
    height: 1px;
    margin: 10px 0;
    background: ${props => props.theme.STROKE_GREY};
    /* border-top: 1px solid ${props => props.theme.STROKE_GREY}; */
`;

export interface Props extends CardProps {
    variant: 'primary' | 'secondary';
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
    const theme = useTheme();
    return (
        <Wrapper {...rest}>
            <Header>
                <Circle>
                    <Icon icon={icon} size={32} color={theme.TYPE_DARK_GREY} />
                    {variant === 'secondary' && (
                        <CheckIconWrapper>
                            <Icon icon="CHECK" color={theme.TYPE_WHITE} size={14} />
                        </CheckIconWrapper>
                    )}
                </Circle>
            </Header>
            <StyledCard noPadding>
                <Title>{heading}</Title>
                <Description>{description}</Description>
                <Footer>
                    {cta && variant === 'primary' && (
                        <Action>
                            <Button
                                fullWidth
                                variant="secondary"
                                isDisabled={cta.isDisabled}
                                onClick={cta.action}
                                {...(cta.dataTest
                                    ? {
                                          'data-test': `@dashboard/security-card/${cta.dataTest}/button`,
                                      }
                                    : {})}
                            >
                                {cta.label}
                            </Button>
                        </Action>
                    )}
                    {cta && variant === 'secondary' && (
                        <>
                            <Line />
                            <Action>
                                <Button
                                    variant="tertiary"
                                    isDisabled={cta.isDisabled}
                                    onClick={cta.action}
                                    icon="ARROW_RIGHT"
                                    alignIcon="right"
                                    {...(cta.dataTest
                                        ? {
                                              'data-test': `@dashboard/security-card/${cta.dataTest}/button`,
                                          }
                                        : {})}
                                >
                                    {cta.label}
                                </Button>
                            </Action>
                        </>
                    )}
                </Footer>
            </StyledCard>
        </Wrapper>
    );
};

export { SecurityCard, Props as SecurityCardProps };
