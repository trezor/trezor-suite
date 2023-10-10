import { ReactNode } from 'react';
import styled, { useTheme } from 'styled-components';
import { Button, Icon, SuiteThemeColors, variables } from '@trezor/components';

const getBgColor = (variant: BannerProps['variant'], theme: SuiteThemeColors) => {
    switch (variant) {
        case 'info':
            return theme.TYPE_BLUE;
        case 'warning':
            return theme.TYPE_ORANGE;
        case 'critical':
            return theme.BG_RED;
        default:
            return 'transparent';
    }
};

const getIcon = (variant: BannerProps['variant'], theme: SuiteThemeColors) => {
    switch (variant) {
        case 'info':
            return <Icon icon="INFO" size={18} color={theme.TYPE_WHITE} />;
        case 'warning':
        case 'critical':
            return <Icon icon="WARNING" size={18} color={theme.TYPE_WHITE} />;
        default:
            return null;
    }
};

const Wrapper = styled.div<{ variant: BannerProps['variant'] }>`
    display: flex;
    background: ${({ theme, variant }) => getBgColor(variant, theme)};
    color: ${({ theme }) => theme.TYPE_WHITE};
    padding: 7px 9px;
    font-weight: 600;
    border-radius: 10px;
    margin: 6px 6px 4px;
    line-height: 1.5;
    align-items: center;

    @media (max-width: ${variables.SCREEN_SIZE.SM}) {
        flex-direction: column;
    }
`;

const IconWrapper = styled.div`
    margin: auto 8px auto 4px;

    @media (max-width: ${variables.SCREEN_SIZE.SM}) {
        display: none;
    }
`;

const BlankLeft = styled.div`
    @media (min-width: ${variables.SCREEN_SIZE.XL}) {
        flex: 1;
    }
`;

const Body = styled.div`
    display: flex;
    width: 100%;
    position: relative;
    justify-content: left;

    @media (max-width: ${variables.SCREEN_SIZE.SM}) {
        text-align: center;
    }

    @media (min-width: ${variables.SCREEN_SIZE.XL}) {
        flex: 6;
        justify-content: center;
    }
`;

const ActionsWrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: flex-end;
    right: 14px;

    @media screen and (max-width: ${variables.SCREEN_SIZE.XL}) {
        position: relative;
        right: auto;
    }

    @media (max-width: ${variables.SCREEN_SIZE.SM}) {
        padding-left: 18px;
        padding-right: 18px;
    }

    @media (min-width: ${variables.SCREEN_SIZE.XL}) {
        flex: 1;
    }
`;

const ActionButton = styled(Button)<{ color: BannerProps['variant'] }>`
    height: 24px;
    margin-right: 4px;
    margin-left: 10px;

    @media (max-width: ${variables.SCREEN_SIZE.SM}) {
        margin-top: 5px;
    }
`;

const CancelWrapper = styled.div`
    margin-left: 5px;
`;

interface BannerProps {
    body: ReactNode;
    variant: 'info' | 'warning' | 'critical';
    action?: {
        label: ReactNode | string;
        onClick: () => void;
        'data-test': string;
    };
    dismissal?: {
        onClick: () => void;
        'data-test': string;
    };
    className?: string;
}

export const Banner = ({ body, variant, action, dismissal, className }: BannerProps) => {
    const theme = useTheme();
    const iconElement = getIcon(variant, theme);

    return (
        <Wrapper variant={variant} className={className}>
            <BlankLeft />
            <Body>
                {iconElement && <IconWrapper>{iconElement}</IconWrapper>}
                {body}
            </Body>
            <ActionsWrapper>
                {action && (
                    <ActionButton
                        color={variant}
                        variant="tertiary"
                        onClick={action.onClick}
                        data-test={action['data-test']}
                    >
                        {action.label}
                    </ActionButton>
                )}
                {dismissal && (
                    <CancelWrapper>
                        <Icon
                            size={20}
                            icon="CROSS"
                            color={theme.TYPE_WHITE}
                            onClick={dismissal.onClick}
                            data-test={dismissal['data-test']}
                        />
                    </CancelWrapper>
                )}
            </ActionsWrapper>
        </Wrapper>
    );
};
