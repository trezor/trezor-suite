import React from 'react';
import { Button, ButtonProps } from '@trezor/components';
import { Translation } from '@suite-components';
import { config } from '@trezor/connect/lib/data/config';

export const WebUsbButton = (props: ButtonProps) => (
    <Button
        {...props}
        icon={props.icon || 'PLUS'}
        onClick={async e => {
            e.stopPropagation();
            try {
                await navigator.usb.requestDevice({ filters: config.webusb });
            } catch (error) {
                // empty
            }
        }}
    >
        <Translation id="TR_CHECK_FOR_DEVICES" />
    </Button>
);
