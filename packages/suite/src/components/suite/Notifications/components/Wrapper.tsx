import React from 'react';
import styled from 'styled-components';
import { Icon, SuiteThemeColors, useTheme } from '@trezor/components';

const getBgColor = (variant: Props['variant'], theme: SuiteThemeColors) => {
    switch (variant) {
        case 'info':
            return theme.BG_BLUE;
        case 'warning':
            return theme.BG_RED;
        default:
            return 'transparent';
    }
};

const getIcon = (variant: Props['variant'], theme: SuiteThemeColors) => {
    switch (variant) {
        case 'info':
            return <Icon icon="INFO" size={16} color={theme.TYPE_WHITE} />;
        case 'warning':
            return <Icon icon="WARNING" size={16} color={theme.TYPE_WHITE} />;
        default:
            return null;
    }
};

const Wrapper = styled.div<{ variant: Props['variant'] }>`
    display: flex;
    background: ${props => getBgColor(props.variant, props.theme)};
    color: ${props => props.theme.TYPE_WHITE};
    padding: 16px;

    & + & {
        border-top: 1px solid ${props => props.theme.BG_WHITE};
    }
`;

const IconWrapper = styled.div`
    margin-right: 8px;
    margin-top: auto;
    margin-bottom: auto;
`;

const Body = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
`;

interface Props {
    children: React.ReactNode;
    variant: 'info' | 'warning';
}

const NotificationsWrapper = ({ variant, children }: Props) => {
    const theme = useTheme();
    const iconElement = getIcon(variant, theme);
    return (
        <Wrapper variant={variant}>
            {iconElement && <IconWrapper>{iconElement}</IconWrapper>}
            <Body>{children}</Body>
        </Wrapper>
    );
};

export default NotificationsWrapper;
