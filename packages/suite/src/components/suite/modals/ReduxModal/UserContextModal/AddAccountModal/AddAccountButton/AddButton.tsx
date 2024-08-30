import { ReactNode } from 'react';
import { ButtonProps, Tooltip, NewModal } from '@trezor/components';
import { Translation } from 'src/components/suite';
import { NetworkCompatible } from '@suite-common/wallet-config';

interface AddButtonProps extends Omit<ButtonProps, 'children'> {
    disabledMessage: ReactNode;
    networkName: NetworkCompatible['name'];
}

export const AddButton = ({ disabledMessage, networkName, ...buttonProps }: AddButtonProps) => (
    <Tooltip maxWidth={285} content={disabledMessage}>
        <NewModal.Button isDisabled={!!disabledMessage} data-testid="@add-account" {...buttonProps}>
            <Translation id="TR_ADD_NETWORK_ACCOUNT" values={{ network: networkName }} />
        </NewModal.Button>
    </Tooltip>
);
