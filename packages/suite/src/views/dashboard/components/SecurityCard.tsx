import { Button, Card, CardProps, Icon, IconProps, variables } from '@trezor/components';
import { spacingsPx, typography } from '@trezor/theme';
import { ReactNode } from 'react';
import styled, { useTheme } from 'styled-components';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
`;

const StyledCard = styled(Card)`
    align-items: stretch;
    flex: 1;
    position: relative;
`;

const Header = styled.div`
    display: flex;
    margin-bottom: ${spacingsPx.xl};
`;

const Title = styled.div`
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
    ${typography.highlight};
`;

const Description = styled.div`
    font-size: ${variables.FONT_SIZE.SMALL};
    width: 200px;
    ${typography.body};
    color: ${({ theme }) => theme.textSubdued};
`;

const Footer = styled.div`
    display: flex;
    width: 100%;
    flex-direction: column;
    margin-top: auto;
`;

const Action = styled.div`
    display: flex;
    width: 100%;
    height: 40px;
`;

const CheckIconContainer = styled.div<{ isDone: boolean }>`
    position: absolute;
    border-radius: 50%;
    width: 24px;
    height: 24px;
    top: ${spacingsPx.xs};
    right: ${spacingsPx.xs};
    overflow: hidden;
    border: 1px solid
        ${({ theme, isDone }) =>
            isDone ? theme.backgroundPrimarySubtleOnElevation1 : theme.borderOnElevation1};
`;

const CheckIconBackground = styled.div`
    background: ${({ theme }) => theme.backgroundPrimarySubtleOnElevation1};
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
`;

const Line = styled.div`
    display: flex;
    width: 100%;
    height: 1px;
    margin: ${spacingsPx.md} 0;
    background: ${({ theme }) => theme.borderOnElevation1};
`;

export interface SecurityCardProps extends CardProps {
    variant: 'primary' | 'secondary';
    icon: IconProps['icon'];
    heading: ReactNode;
    description?: ReactNode;
    cta?: {
        label: ReactNode;
        action?: () => void;
        dataTest?: string;
        isDisabled?: boolean;
    };
}

export const SecurityCard = ({
    variant,
    icon,
    heading,
    description,
    cta,
    ...rest
}: SecurityCardProps) => {
    const theme = useTheme();

    const isDone = variant === 'secondary';

    return (
        <Wrapper {...rest}>
            <StyledCard>
                <Header>
                    <Icon icon={icon} size={32} color={theme.iconDefault} />
                    <CheckIconContainer isDone={isDone}>
                        {isDone && (
                            <CheckIconBackground>
                                <Icon icon="CHECK" color={theme.iconPrimaryDefault} size={16} />
                            </CheckIconBackground>
                        )}
                    </CheckIconContainer>
                </Header>
                <Title>{heading}</Title>
                <Description>{description}</Description>
                <Footer>
                    {cta && variant === 'primary' && (
                        <>
                            <Line />
                            <Action>
                                <Button
                                    isFullWidth
                                    variant="primary"
                                    isDisabled={cta.isDisabled}
                                    onClick={cta.action}
                                    size="small"
                                    {...(cta.dataTest
                                        ? {
                                              'data-test-id': `@dashboard/security-card/${cta.dataTest}/button`,
                                          }
                                        : {})}
                                >
                                    {cta.label}
                                </Button>
                            </Action>
                        </>
                    )}
                    {cta && isDone && (
                        <>
                            <Line />
                            <Action>
                                <Button
                                    isFullWidth
                                    variant="primary"
                                    isDisabled={cta.isDisabled}
                                    onClick={cta.action}
                                    icon="ARROW_RIGHT"
                                    iconAlignment="right"
                                    size="small"
                                    {...(cta.dataTest
                                        ? {
                                              'data-test-id': `@dashboard/security-card/${cta.dataTest}/button`,
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
