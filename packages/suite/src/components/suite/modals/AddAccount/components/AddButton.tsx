import React from 'react';
import { TooltipButton } from '@trezor/components';
import { Translation } from '@suite-components';

interface ButtonProps {
    disabledMessage: React.ReactNode;
    handleClick: () => void;
}

export const AddButton = ({ disabledMessage, handleClick }: ButtonProps) => (
    <TooltipButton
        tooltipContent={disabledMessage}
        isDisabled={!!disabledMessage}
        onClick={handleClick}
        data-test="@add-account"
    >
        <Translation id="TR_ADD_ACCOUNT" />
    </TooltipButton>
);
