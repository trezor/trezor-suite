import TrezorConnect from '@trezor/connect';
import { ButtonProps, Button, IconButton, Tooltip } from '@trezor/components';
import { Translation, TranslationKey } from './Translation';

interface WebUsbButtonProps extends Omit<ButtonProps, 'children' | 'icon'> {
    translationId?: TranslationKey;
    icon?: ButtonProps['icon'] | false;
}

const handleClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.stopPropagation();
    TrezorConnect.requestWebUSBDevice();
};

export const WebUsbButton = ({
    translationId = 'TR_CHECK_FOR_DEVICES',
    icon = 'SEARCH',
    size = 'tiny',
    variant = 'primary',
    ...rest
}: WebUsbButtonProps) => (
    <div data-test="web-usb-button">
        <Button
            {...rest}
            icon={icon === false ? undefined : icon}
            size={size}
            variant={variant}
            onClick={handleClick}
        >
            <Translation id={translationId} />
        </Button>
    </div>
);

export const WebUsbIconButton = ({
    translationId = 'TR_CHECK_FOR_DEVICES',
    size = 'tiny',
    variant = 'primary',
    ...rest
}: WebUsbButtonProps) => (
    <div data-test="web-usb-button">
        <Tooltip content={<Translation id={translationId} />}>
            <IconButton
                {...rest}
                icon="SEARCH"
                variant={variant}
                size={size}
                onClick={handleClick}
            />
        </Tooltip>
    </div>
);
