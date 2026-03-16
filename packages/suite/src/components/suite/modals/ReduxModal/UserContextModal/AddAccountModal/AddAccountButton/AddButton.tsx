import { type ReactNode } from 'react';

import { Translation } from '@suite/intl';
import { type Network } from '@suite-common/wallet-config';
import { type ButtonProps, Modal, Tooltip } from '@trezor/components';

type AddButtonProps = Partial<ButtonProps> & {
    disabledMessage: ReactNode;
    networkName: Network['name'];
};

export const AddButton = ({ disabledMessage, networkName, ...buttonProps }: AddButtonProps) => (
    <Tooltip tooltipMaxWidth={285} content={disabledMessage}>
        <Modal.Button isDisabled={!!disabledMessage} data-testid="@add-account" {...buttonProps}>
            <Translation id="TR_ADD_NETWORK_ACCOUNT" values={{ network: networkName }} />
        </Modal.Button>
    </Tooltip>
);
