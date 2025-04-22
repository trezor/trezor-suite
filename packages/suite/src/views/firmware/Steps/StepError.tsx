import { H3, Modal, Paragraph } from '@trezor/components';

import { Translation } from '../../../components/suite';

type StepErrorProps = {
    onClose: () => void;
    error: string | undefined;
};

export const StepError = ({ onClose, error }: StepErrorProps) => (
    <Modal.ModalBase
        onCancel={onClose}
        data-testid="@firmware-modal"
        bottomContent={
            <Modal.Button variant="tertiary" onClick={onClose}>
                <Translation id="TR_CLOSE" />
            </Modal.Button>
        }
        iconName="warning"
        variant="destructive"
    >
        <H3>
            <Translation id="TR_FW_INSTALLATION_FAILED" />
        </H3>
        <Paragraph>
            <Translation id="TOAST_GENERIC_ERROR" values={{ error: error || '' }} />
        </Paragraph>
    </Modal.ModalBase>
);
