import type { ReactNode } from 'react';

import type { Network } from '@suite-common/wallet-config';
import type { ButtonProps } from '@trezor/components';
import { Modal, Tooltip } from '@trezor/components';

import { Translation } from 'src/components/suite/Translation';

interface AddButtonProps extends Omit<ButtonProps, 'children'> {
    disabledMessage: ReactNode;
    networkName: Network['name'];
}

export const AddButton = ({ disabledMessage, networkName, ...buttonProps }: AddButtonProps) => (
    <Tooltip tooltipMaxWidth={285} content={disabledMessage}>
        <Modal.Button isDisabled={!!disabledMessage} data-testid="@add-account" {...buttonProps}>
            <Translation id="TR_ADD_NETWORK_ACCOUNT" values={{ network: networkName }} />
        </Modal.Button>
    </Tooltip>
);
