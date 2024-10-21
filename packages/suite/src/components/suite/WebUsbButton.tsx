import TrezorConnect from '@trezor/connect';
import type TrezorConnectWeb from '@trezor/connect-web';
import { ButtonProps, Button, IconButton, Tooltip } from '@trezor/components';
import { Translation, TranslationKey } from './Translation';

interface WebUsbButtonProps extends Omit<ButtonProps, 'children' | 'icon'> {
    translationId?: TranslationKey;
    icon?: ButtonProps['icon'] | false;
}

const handleClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.stopPropagation();
    (TrezorConnect as typeof TrezorConnectWeb).requestWebUSBDevice();
};

export const WebUsbButton = ({
    translationId = 'TR_CHECK_FOR_DEVICES',
    icon = 'search',
    size = 'tiny',
    variant = 'primary',
    ...rest
}: WebUsbButtonProps) => (
    <div data-testid="web-usb-button">
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
    <div data-testid="web-usb-button">
        <Tooltip content={<Translation id={translationId} />}>
            <IconButton
                {...rest}
                icon="search"
                variant={variant}
                size={size}
                onClick={handleClick}
            />
        </Tooltip>
    </div>
);
