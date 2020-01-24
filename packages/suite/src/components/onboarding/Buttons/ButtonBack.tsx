import React from 'react';
import { Button } from '@trezor/components-v2';

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    isDisabled?: boolean;
}

const ButtonBack = (props: Props) => (
    <Button variant="tertiary" icon="ARROW_LEFT" {...props} style={{ backgroundColor: 'initial' }}>
        {props.children}
    </Button>
);

export default ButtonBack;
