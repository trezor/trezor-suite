import { Translation } from '@suite/intl';
import { Button, type ButtonProps } from '@trezor/components';
import TrezorConnect, { type TrezorConnectWithBrowserAPI } from '@trezor/connect';
import { MagnifyingGlassIcon } from '@trezor/icons';

const handleClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.stopPropagation();
    (TrezorConnect as TrezorConnectWithBrowserAPI).requestWebUSBDevice();
};

type WebUsbButtonProps = Omit<ButtonProps, 'onClick' | 'data-testid' | 'children' | 'iconRight'> & {
    children?: React.ReactNode;
};

export const WebUsbButton = (props: WebUsbButtonProps) => (
    <Button
        {...props}
        size={props.size ?? 'small'}
        iconLeft={props.iconLeft ?? MagnifyingGlassIcon}
        data-testid="web-usb-button"
        onClick={handleClick}
    >
        {props.children ?? <Translation id="TR_CHECK_FOR_DEVICES" />}
    </Button>
);
