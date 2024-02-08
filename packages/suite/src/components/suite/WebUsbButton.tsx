// import TrezorConnect from '@trezor/connect';
import { ButtonProps, Button } from '@trezor/components';
import { openModal } from 'src/actions/suite/modalActions';
import { useDispatch } from 'src/hooks/suite';
import { Translation } from './Translation';

export const WebUsbButton = (props: Omit<ButtonProps, 'children'>) => {
    const dispatch = useDispatch();
    return (
        <div data-test="web-usb-button">
            <Button
                {...props}
                icon="SEARCH"
                variant="primary"
                onClick={e => {
                    e.stopPropagation();
                    // TrezorConnect.requestWebUSBDevice();
                    dispatch(openModal({ type: 'select-bluetooth-device' }));
                }}
                size="small"
            >
                <Translation id="TR_CHECK_FOR_DEVICES" />
            </Button>
        </div>
    );
};
