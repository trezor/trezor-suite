import React from 'react';
import styled from 'styled-components';
import { Icon, useTheme, variables } from '@trezor/components';

const Header = styled.div`
    display: flex;
    margin-top: 4px;
    color: ${({ theme }) => theme.TYPE_ORANGE};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    font-size: ${variables.FONT_SIZE.TINY};
    align-items: center;
`;

const IconWrapper = styled.div`
    margin-right: 16px;
`;

const Body = styled.div`
    display: flex;
    flex: 1;
`;

interface WarnHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
    action?: React.ReactNode;
    children?: React.ReactNode;
}

export const WarnHeader = ({ action, children, ...rest }: WarnHeaderProps) => {
    const theme = useTheme();

    return (
        <Header {...rest}>
            <IconWrapper>
                <Icon size={16} icon="WARNING" color={theme.TYPE_ORANGE} />
            </IconWrapper>
            <Body>{children}</Body>
            {action}
        </Header>
    );
};
