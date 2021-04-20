import React from 'react';
import styled from 'styled-components';
import { Button, Icon, SuiteThemeColors, useTheme, variables } from '@trezor/components';

const getBgColor = (variant: Props['variant'], theme: SuiteThemeColors) => {
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

const getIcon = (variant: Props['variant'], theme: SuiteThemeColors) => {
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

const Wrapper = styled.div<{ variant: Props['variant'] }>`
    display: flex;
    background: ${props => getBgColor(props.variant, props.theme)};
    color: ${props => props.theme.TYPE_WHITE};
    padding: 7px 9px;
    font-weight: 600;
    border-radius: 10px;
    margin: 6px 6px 4px;
    line-height: 1.5;
`;

const IconWrapper = styled.div`
    margin: auto 8px auto 4px;
`;

const Body = styled.div`
    display: flex;
    justify-content: center;
    width: 100%;
    position: relative;

    @media screen and (max-width: ${variables.SCREEN_SIZE.XL}) {
        justify-content: left;
    }
`;

const ActionsWrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    position: absolute;
    right: 14px;

    @media screen and (max-width: ${variables.SCREEN_SIZE.XL}) {
        position: relative;
        right: auto;
    }
`;

const ActionButton = styled(Button)<{ color: Props['variant'] }>`
    height: 24px;
    margin-right: 4px;
    margin-left: 10px;
`;

const CancelWrapper = styled.div`
    margin-left: 5px;
`;

interface Props {
    body: React.ReactNode;
    variant: 'info' | 'warning' | 'critical';
    action?: {
        label: React.ReactNode | string;
        onClick: () => void;
        'data-test': string;
    };
    dismissal?: {
        onClick: () => void;
        'data-test': string;
    };
}

const BannerWrapper = ({ body, variant, action, dismissal }: Props) => {
    const theme = useTheme();
    const iconElement = getIcon(variant, theme);

    return (
        <Wrapper variant={variant}>
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

export default BannerWrapper;
