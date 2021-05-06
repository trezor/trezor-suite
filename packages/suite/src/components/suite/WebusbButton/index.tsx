import React from 'react';
import { Button, ButtonProps } from '@trezor/components';
import { Translation } from '@suite-components';

// TODO: those constants should be exposed by connect
const filters = [
    { vendorId: 0x534c, productId: 0x0001 },
    { vendorId: 0x1209, productId: 0x53c0 },
    { vendorId: 0x1209, productId: 0x53c1 },
];

const WebusbButton = (props: ButtonProps) => (
    <Button
        {...props}
        icon={props.icon || 'PLUS'}
        onClick={async () => {
            try {
                // @ts-ignore navigator.usb not found
                await navigator.usb.requestDevice({ filters });
            } catch (error) {
                // empty
            }
        }}
    >
        <Translation id="TR_CHECK_FOR_DEVICES" />
    </Button>
);
export default WebusbButton;
