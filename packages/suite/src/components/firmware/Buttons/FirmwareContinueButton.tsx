import React from 'react';
import styled from 'styled-components';
import { Button, ButtonProps } from '@trezor/components';
import { Translation } from 'src/components/suite';

// eslint-disable-next-line local-rules/no-override-ds-component
const StyledButton = styled(Button)`
    min-width: 180px;
`;

export const FirmwareContinueButton = (props: Omit<ButtonProps, 'children'>) => (
    <StyledButton {...props} data-testid="@firmware/continue-button">
        <Translation id="TR_CONTINUE" />
    </StyledButton>
);
