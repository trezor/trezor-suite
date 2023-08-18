import TrezorConnect from '@trezor/connect';
import { Button, ButtonProps } from '@trezor/components';
import { Translation } from 'src/components/suite';

export const WebUsbButton = (props: Omit<ButtonProps, 'children'>) => (
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
