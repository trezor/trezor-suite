import { ReactNode } from 'react';

import { Network } from '@suite-common/wallet-config';
import { ButtonProps, Modal, Tooltip } from '@trezor/components';

import { Translation } from 'src/components/suite';

interface AddButtonProps extends Omit<ButtonProps, 'children'> {
    disabledMessage: ReactNode;
    networkName: Network['name'];
}

export const AddButton = ({ disabledMessage, networkName, ...buttonProps }: AddButtonProps) => (
    <Tooltip maxWidth={285} content={disabledMessage}>
        <Modal.Button isDisabled={!!disabledMessage} data-testid="@add-account" {...buttonProps}>
            <Translation id="TR_ADD_NETWORK_ACCOUNT" values={{ network: networkName }} />
        </Modal.Button>
    </Tooltip>
);
