import { type ReactNode } from 'react';

import { Translation } from '@suite/intl';
import { type EarnModalAction } from '@suite-common/suite-types/src/staking';
import { Modal } from '@trezor/components';

type EarnInANutshellModalLayoutProps = {
    heading: ReactNode;
    onCancel: () => void;
    actionType?: EarnModalAction;
    onAction: () => void;
    children: ReactNode;
};

export const EarnInANutshellModalLayout = ({
    heading,
    onCancel,
    actionType = 'continue',
    onAction,
    children,
}: EarnInANutshellModalLayoutProps) => (
    <Modal
        heading={heading}
        width={400}
        onCancel={onCancel}
        bottomContent={
            <Modal.Button onClick={onAction} data-testid="@modal/staking/continue-button">
                <Translation id={actionType === 'close' ? 'TR_GOT_IT' : 'TR_CONTINUE'} />
            </Modal.Button>
        }
    >
        {children}
    </Modal>
);
