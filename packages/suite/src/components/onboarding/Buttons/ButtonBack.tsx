import React from 'react';
import { Button, ButtonProps } from '@trezor/components-v2';

const ButtonBack = (props: ButtonProps) => (
    <Button variant="tertiary" icon="ARROW_LEFT" {...props} style={{ backgroundColor: 'initial' }}>
        {props.children}
    </Button>
);

export default ButtonBack;
