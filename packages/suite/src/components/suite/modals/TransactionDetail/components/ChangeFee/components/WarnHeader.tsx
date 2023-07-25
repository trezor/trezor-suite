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

interface Props {
    action?: React.ReactNode;
    children?: React.ReactNode;
}

export const WarnHeader = (props: Props) => {
    const theme = useTheme();

    return (
        <Header>
            <IconWrapper>
                <Icon size={16} icon="WARNING" color={theme.TYPE_ORANGE} />
            </IconWrapper>
            <Body>{props.children}</Body>
            {props.action && props.action}
        </Header>
    );
};
