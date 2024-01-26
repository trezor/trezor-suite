import TrezorConnect from '@trezor/connect';
import { ButtonProps, Button } from '@trezor/components';
import { Translation } from './Translation';

export const WebUsbButton = (props: Omit<ButtonProps, 'children'>) => (
    <div data-test="TR_CHECK_FOR_DEVICES">
        <Button
            {...props}
            icon="SEARCH"
            variant="primary"
            onClick={e => {
                e.stopPropagation();
                TrezorConnect.requestWebUSBDevice();
            }}
            size="small"
        >
            <Translation id="TR_CHECK_FOR_DEVICES" />
        </Button>
    </div>
);
