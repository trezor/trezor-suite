import React from 'react';
import styled from 'styled-components';
import { Button, ButtonProps } from '@trezor/components';

const StyledButton = styled(Button)`
    background-color: initial;
`;

const ButtonBack = (props: ButtonProps) => (
    <StyledButton
        data-test="@onboarding/back-button"
        variant="tertiary"
        icon="ARROW_LEFT"
        {...props}
    >
        {props.children}
    </StyledButton>
);

export default ButtonBack;
