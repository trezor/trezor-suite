import React from 'react';
import { Button, Tooltip } from '@trezor/components';
import { Translation } from '@suite-components';
import { TrezorDevice } from '@suite-types';

interface Props {
    onClick?: () => void;
    disabled: boolean;
    isOverlaying?: boolean;
    device?: TrezorDevice;
}

const AddAccountButton = ({ onClick, disabled, device }: Props) => {
    const clickHandler = !disabled ? onClick : undefined;
    const tooltipMessage =
        device && !device.connected ? (
            <Translation id="TR_TO_ADD_NEW_ACCOUNT_PLEASE_CONNECT" />
        ) : undefined;

    const ButtonRow = (
        <Button onClick={clickHandler} icon="PLUS" variant="tertiary" isDisabled={disabled} />
    );

    if (tooltipMessage) {
        return (
            <Tooltip maxWidth={200} offset={50} content={tooltipMessage} placement="bottom">
                {ButtonRow}
            </Tooltip>
        );
    }
    return ButtonRow;
};

export default AddAccountButton;
