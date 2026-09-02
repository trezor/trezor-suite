import { type ReactNode } from 'react';

import { Translation } from '@suite/intl';
import { type EarnModalAction } from '@suite-common/suite-types/src/staking';
import { Modal } from '@trezor/components';

type EarnInANutshellModalLayoutProps = {
    heading: ReactNode;
    onCancel: () => void;
    actionType?: EarnModalAction;
    onAction: () => void;
    hasCancelButton?: boolean;
    children: ReactNode;
};

export const EarnInANutshellModalLayout = ({
    heading,
    onCancel,
    actionType = 'continue',
    onAction,
    hasCancelButton = false,
    children,
}: EarnInANutshellModalLayoutProps) => (
    <Modal
        data-testid="@modal/earn-in-a-nutshell"
        heading={heading}
        width={400}
        onCancel={onCancel}
        bottomContent={
            <>
                <Modal.Button onClick={onAction} data-testid="@modal/staking/continue-button">
                    <Translation id={actionType === 'close' ? 'TR_GOT_IT' : 'TR_CONTINUE'} />
                </Modal.Button>
                {hasCancelButton && (
                    <Modal.Button
                        intent="neutral"
                        priority="secondary"
                        onClick={onCancel}
                        data-testid="@modal/staking/cancel-button"
                    >
                        <Translation id="TR_CANCEL" />
                    </Modal.Button>
                )}
            </>
        }
    >
        {children}
    </Modal>
);
