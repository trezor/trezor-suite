import React from 'react';
import TrezorConnect from '@trezor/connect';
import { Button, ButtonProps } from '@trezor/components';
import { Translation } from '@suite-components';

export const WebUsbButton = (props: ButtonProps) => (
    <Button
        {...props}
        icon="SEARCH"
        onClick={e => {
            e.stopPropagation();
            TrezorConnect.requestWebUSBDevice();
        }}
    >
        <Translation id="TR_CHECK_FOR_DEVICES" />
    </Button>
);
