import React from 'react';

import { Button, ButtonProps } from '@trezor/components';
import { Translation } from 'src/components/suite';

export const FirmwareCloseButton = (props: Omit<ButtonProps, 'children'>) => (
    <Button {...props}>
        <Translation id="TR_CLOSE" />
    </Button>
);
