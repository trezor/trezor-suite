import React from 'react';
import styled from 'styled-components';
import { colors, variables } from '@trezor/components';

const StyledItem = styled.div`
    padding: 12px 24px;
    display: flex;
    height: 38px;
    align-items: center;
    font-size: ${variables.FONT_SIZE.BASE};
    cursor: pointer;
    color: ${colors.TEXT_SECONDARY};

    &:hover {
        background: ${colors.GRAY_LIGHT};
    }
`;

const MenuItem = ({ ...props }) => <StyledItem {...props}>{props.children}</StyledItem>;

export default MenuItem;
