import { Translation } from '@suite/intl';
import { Button, type ButtonProps } from '@trezor/components';
import TrezorConnect from '@trezor/connect';
import type TrezorConnectBrowser from '@trezor/connect/src/index.browser';

const handleClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.stopPropagation();
    (TrezorConnect as typeof TrezorConnectBrowser).requestWebUSBDevice();
};

type WebUsbButtonProps = Omit<ButtonProps, 'onClick' | 'data-testid' | 'children' | 'iconRight'> & {
    children?: React.ReactNode;
};

export const WebUsbButton = (props: WebUsbButtonProps) => (
    <Button
        {...props}
        size={props.size ?? 'small'}
        iconLeft={props.iconLeft ?? 'magnifyingGlass'}
        data-testid="web-usb-button"
        onClick={handleClick}
    >
        {props.children ?? <Translation id="TR_CHECK_FOR_DEVICES" />}
    </Button>
);
