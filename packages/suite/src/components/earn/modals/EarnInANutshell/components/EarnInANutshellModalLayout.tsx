import { ReactNode } from 'react';

import { Translation } from '@suite/intl';
import { Modal } from '@trezor/components';

interface EarnInANutshellModalLayoutProps {
    heading: ReactNode;
    onCancel: () => void;
    onContinue: () => void;
    children: ReactNode;
}

export const EarnInANutshellModalLayout = ({
    heading,
    onCancel,
    onContinue,
    children,
}: EarnInANutshellModalLayoutProps) => (
    <Modal
        heading={heading}
        width={400}
        onCancel={onCancel}
        bottomContent={
            <Modal.Button onClick={onContinue} data-testid="@modal/staking/continue-button">
                <Translation id="TR_CONTINUE" />
            </Modal.Button>
        }
    >
        {children}
    </Modal>
);
