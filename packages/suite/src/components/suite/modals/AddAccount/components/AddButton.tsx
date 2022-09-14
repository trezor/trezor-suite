import React from 'react';
import { Button, Tooltip } from '@trezor/components';
import { Translation } from '@suite-components';

interface ButtonProps {
    disabledMessage: React.ReactNode;
    handleClick: () => void;
}

export const AddButton = ({ disabledMessage, handleClick }: ButtonProps) => (
    <Tooltip maxWidth={285} content={disabledMessage}>
        <Button
            data-test="@add-account"
            icon="PLUS"
            variant="primary"
            isDisabled={!!disabledMessage}
            onClick={handleClick}
        >
            <Translation id="TR_ADD_ACCOUNT" />
        </Button>
    </Tooltip>
);
