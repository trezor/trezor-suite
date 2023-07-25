import React from 'react';
import { Button } from '@trezor/components';

interface ButtonAltProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    isDisabled?: boolean;
}

const ButtonAlt = (props: ButtonAltProps) => (
    <Button variant="secondary" {...props}>
        {props.children}
    </Button>
);

export default ButtonAlt;
