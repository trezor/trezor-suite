// import TrezorConnect from '@trezor/connect';
import { ButtonProps, Button } from '@trezor/components';
import { Translation } from './Translation';

export const WebUsbButton = (props: Omit<ButtonProps, 'children'>) => (
    <div data-test="web-usb-button">
        <Button
            {...props}
            icon="SEARCH"
            variant="primary"
            onClick={e => {
                e.stopPropagation();
                // TrezorConnect.requestWebUSBDevice();
                try {
                    // @ts-expect-error
                    navigator.bluetooth.requestDevice({
                        filters: [{ services: ['6e400001-b5a3-f393-e0a9-e50e24dcca9e'] }],
                    });
                } catch (error) {
                    // silent
                }
            }}
            size="small"
        >
            <Translation id="TR_CHECK_FOR_DEVICES" />
        </Button>
    </div>
);
