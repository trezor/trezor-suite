import TrezorConnect from '@trezor/connect';
import { ButtonProps, IconButton } from '@trezor/components';
import { useTranslation } from 'src/hooks/suite';

export const WebUsbButton = (props: Omit<ButtonProps, 'children'>) => {
    const { translationString } = useTranslation();
    return (
        <div data-test="TR_CHECK_FOR_DEVICES">
            <IconButton
                {...props}
                icon="REFRESH"
                title={translationString('TR_CHECK_FOR_DEVICES')}
                variant="tertiary"
                onClick={e => {
                    e.stopPropagation();
                    TrezorConnect.requestWebUSBDevice();
                }}
                size="small"
            />
        </div>
    );
};
