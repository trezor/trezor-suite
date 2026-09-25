import { useRef, useState } from 'react';

import { useDevice } from '@suite/device';
import { useServices } from '@suite-common/dependency-injection';
import { injectDispatch } from '@suite-common/redux-utils';
import { type ToastPayload, notificationsActions } from '@suite-common/toast-notifications';
import { Checkbox, Input } from '@trezor/components';
import TrezorConnect from '@trezor/connect';
import { SectionItem } from '@trezor/product-components';

export const PingDevice = () => {
    const { device, isLocked } = useDevice();
    const [isLoading, setIsLoading] = useState(false);
    const [buttonProtection, setButtonProtection] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const { dispatch } = useServices(injectDispatch);

    const isDeviceLocked = isLocked();

    const handleClick = async () => {
        setIsLoading(true);
        const response = await TrezorConnect.pingDevice({
            device,
            message: inputRef.current?.value ?? '',
            button_protection: buttonProtection,
        });
        setIsLoading(false);

        let toastPayload: ToastPayload;
        if (response.success) {
            toastPayload = {
                type: 'connect-popup-success',
                appName: 'Ping',
            };
        } else {
            toastPayload = {
                type: 'error',
                error: response.error.message,
            };
        }
        dispatch(notificationsActions.addToast(toastPayload));
    };

    return (
        <SectionItem
            actions={
                <>
                    <Input innerRef={inputRef} placeholder="Ping message" />
                    <Checkbox
                        isChecked={buttonProtection}
                        labelAlignment="end"
                        onChange={() => setButtonProtection(prev => !prev)}
                    >
                        With confirmation
                    </Checkbox>
                    <SectionItem.Button
                        onClick={handleClick}
                        size="small"
                        isDisabled={isDeviceLocked}
                        isLoading={isLoading}
                    >
                        Send
                    </SectionItem.Button>
                </>
            }
        />
    );
};
