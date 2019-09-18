import React from 'react';
import { Button } from '@trezor/components';

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    isDisabled?: boolean;
}

const ButtonBack = (props: Props) => (
    <Button isTransparent {...props}>
        {props.children}
    </Button>
);

export default ButtonBack;
