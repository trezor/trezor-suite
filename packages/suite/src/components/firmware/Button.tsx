import React from 'react';
import styled from 'styled-components';
import { Button, ButtonProps } from '@trezor/components';
import { Translation } from '@suite-components';

const StyledButton = styled(Button)`
    min-width: 180px;
`;

export const RetryButton = (props: ButtonProps) => (
    <Button {...props} data-test="@firmware/retry-button">
        <Translation id="TR_RETRY" />
    </Button>
);

export const ContinueButton = (props: ButtonProps) => (
    <StyledButton {...props} data-test="@firmware/continue-button">
        <Translation id="TR_CONTINUE" />
    </StyledButton>
);

export const InstallButton = (props: ButtonProps) => (
    <StyledButton {...props} data-test="@firmware/install-button">
        <Translation id="TR_INSTALL" />
    </StyledButton>
);

export const CloseButton = (props: ButtonProps) => (
    <Button {...props}>
        <Translation id="TR_CLOSE" />
    </Button>
);

export const ConfirmButton = (props: ButtonProps) => (
    <Button {...props}>
        <Translation id="TR_CONFIRM" />
    </Button>
);
