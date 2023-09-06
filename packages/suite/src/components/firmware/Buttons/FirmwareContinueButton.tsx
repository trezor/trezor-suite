import React from 'react';
import styled from 'styled-components';
import { Button, ButtonProps } from '@trezor/components';
import { Translation } from 'src/components/suite';

const StyledButton = styled(Button)`
    min-width: 180px;
`;

export const FirmwareContinueButton = (props: ButtonProps) => (
    <StyledButton {...props} data-test="@firmware/continue-button">
        <Translation id="TR_CONTINUE" />
    </StyledButton>
);
