import { ReactNode, HTMLAttributes } from 'react';
import styled, { useTheme } from 'styled-components';
import { Icon, variables } from '@trezor/components';

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

interface WarnHeaderProps extends HTMLAttributes<HTMLDivElement> {
    action?: ReactNode;
    children?: ReactNode;
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
