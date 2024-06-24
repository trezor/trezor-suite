import TrezorConnect from '@trezor/connect';
import { ButtonProps, Button } from '@trezor/components';
import { Translation, TranslationKey } from './Translation';

interface WebUsbButtonProps extends Omit<ButtonProps, 'children' | 'icon'> {
    translationId?: TranslationKey;
    icon?: ButtonProps['icon'] | false;
}

export const WebUsbButton = ({
    translationId = 'TR_CHECK_FOR_DEVICES',
    icon = 'SEARCH',
    size = 'tiny',
    ...rest
}: WebUsbButtonProps) => (
    <div data-test="web-usb-button">
        <Button
            {...rest}
            icon={icon === false ? undefined : icon}
            size={size}
            variant="primary"
            onClick={e => {
                e.stopPropagation();
                TrezorConnect.requestWebUSBDevice();
            }}
        >
            <Translation id={translationId} />
        </Button>
    </div>
);
