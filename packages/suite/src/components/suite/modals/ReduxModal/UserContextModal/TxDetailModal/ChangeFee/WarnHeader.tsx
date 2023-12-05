import { ReactNode, HTMLAttributes } from 'react';
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

const Body = styled.div`
    display: flex;
    flex: 1;
    padding: 0 16px;
`;

interface WarnHeaderProps extends HTMLAttributes<HTMLDivElement> {
    action?: ReactNode;
    children?: ReactNode;
}

export const WarnHeader = ({ action, children, ...rest }: WarnHeaderProps) => {
    const theme = useTheme();

    return (
        <Header {...rest}>
            <Icon size={16} icon="WARNING" color={theme.TYPE_ORANGE} />
            <Body>{children}</Body>
            {action}
        </Header>
    );
};
