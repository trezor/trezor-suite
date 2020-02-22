import React from 'react';
import { Button } from '@trezor/components';

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    isDisabled?: boolean;
}

const ButtonAlt = (props: Props) => (
    <Button variant="secondary" {...props}>
        {props.children}
    </Button>
);

export default ButtonAlt;
