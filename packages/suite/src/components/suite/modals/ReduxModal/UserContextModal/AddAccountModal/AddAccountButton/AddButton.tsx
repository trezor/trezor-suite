import { ReactNode } from 'react';
import { TooltipButton, ButtonProps } from '@trezor/components';
import { Translation } from 'src/components/suite';
import { Network } from '@suite-common/wallet-config';

interface AddButtonProps extends Omit<ButtonProps, 'children'> {
    disabledMessage: ReactNode;
    handleClick: () => void;
    networkName: Network['name'];
}

export const AddButton = ({
    disabledMessage,
    handleClick,
    networkName,
    ...buttonProps
}: AddButtonProps) => (
    <TooltipButton
        tooltipContent={disabledMessage}
        isDisabled={!!disabledMessage}
        size="small"
        onClick={handleClick}
        data-test="@add-account"
        {...buttonProps}
    >
        <Translation id="TR_ADD_NETWORK_ACCOUNT" values={{ network: networkName }} />
    </TooltipButton>
);
