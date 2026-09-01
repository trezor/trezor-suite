import { useRef, useState } from 'react';

import { useDevice } from '@suite/device';
import { useDispatch } from '@suite-common/redux-utils';
import { type ToastPayload, notificationsActions } from '@suite-common/toast-notifications';
import { Checkbox, Input } from '@trezor/components';
import TrezorConnect from '@trezor/connect';
import { ActionButton, ActionColumn, SectionItem, TextColumn } from '@trezor/product-components';

export const PingDevice = () => {
    const { device, isLocked } = useDevice();
    const [isLoading, setIsLoading] = useState(false);
    const [buttonProtection, setButtonProtection] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const dispatch = useDispatch();

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
        <SectionItem>
            <ActionColumn>
                <Input innerRef={inputRef} placeholder="Ping message" />
            </ActionColumn>

            <ActionColumn>
                <Checkbox
                    isChecked={buttonProtection}
                    labelAlignment="end"
                    onChange={() => setButtonProtection(prev => !prev)}
                >
                    <TextColumn description="With confirmation" />
                </Checkbox>
                <ActionButton
                    onClick={handleClick}
                    size="small"
                    isDisabled={isDeviceLocked}
                    isLoading={isLoading}
                >
                    Send
                </ActionButton>
            </ActionColumn>
        </SectionItem>
    );
};
