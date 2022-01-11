import React from 'react';
import styled from 'styled-components';
import { Button, useTheme } from '@trezor/components';
import type { ButtonProps } from '@trezor/components';
import { darken } from 'polished';

const StyledButton = styled(Button)`
    background: ${({ theme }) => theme.STROKE_GREY};

    &:hover,
    &:focus,
    &:active {
        background: ${({ theme }) => darken(theme.HOVER_DARKEN_FILTER, theme.STROKE_GREY)};
    }
`;

const CloseButton = (props: ButtonProps) => {
    const theme = useTheme();
    return (
        <StyledButton icon="CROSS" variant="secondary" color={theme.TYPE_LIGHT_GREY} {...props} />
    );
};

export default CloseButton;
