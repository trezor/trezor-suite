import React from 'react';

import { Button, ButtonProps } from '@trezor/components';
import { Translation } from '@suite-components';

export const RetryButton = (props: ButtonProps) => (
    <Button {...props} data-test="@firmware/retry-button">
        <Translation id="TR_RETRY" />
    </Button>
);

export const ContinueButton = (props: ButtonProps) => {
    return (
        <Button {...props} data-test="@firmware/continue-button">
            <Translation id="TR_CONTINUE" />
        </Button>
    );
};

export const InstallButton = (props: ButtonProps) => {
    return (
        <Button {...props} data-test="@firmware/install-button">
            <Translation id="TR_INSTALL" />
        </Button>
    );
};

export const CloseButton = (props: ButtonProps) => (
    <Button {...props}>
        <Translation id="TR_CLOSE" />
    </Button>
);
