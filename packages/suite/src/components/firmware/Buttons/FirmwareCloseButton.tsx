import React from 'react';

import { Button, ButtonProps } from '@trezor/components';
import { Translation } from 'src/components/suite';

export const FirmwareCloseButton = (props: ButtonProps) => (
    <Button {...props}>
        <Translation id="TR_CLOSE" />
    </Button>
);
