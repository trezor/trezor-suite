import React from 'react';
import { Button } from '@trezor/components-v2';

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    isDisabled?: boolean;
}

const ButtonBack = (props: Props) => (
    <Button variant="tertiary" {...props} inlineWidth>
        {props.children}
    </Button>
);

export default ButtonBack;
