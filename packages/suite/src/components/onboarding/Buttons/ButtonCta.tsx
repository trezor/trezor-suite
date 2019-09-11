import React from 'react';
import { Button } from '@trezor/components';

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    isDisabled?: boolean;
}

const ButtonCta = (props: Props) => <Button {...props}>{props.children}</Button>;

export default ButtonCta;
