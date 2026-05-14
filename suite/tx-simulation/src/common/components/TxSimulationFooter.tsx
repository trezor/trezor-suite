import { Translation } from '@suite/intl';
import { Modal } from '@trezor/components';

interface TxSimulationFooterProps {
    onConfirm: () => void;
    onCancel: () => void;
    isConfirmDisabled: boolean;
}

export function TxSimulationFooter({
    onConfirm,
    onCancel,
    isConfirmDisabled,
}: TxSimulationFooterProps) {
    return (
        <>
            <Modal.Button
                onClick={onConfirm}
                data-testid="@tx-simulation-modal/confirm-button"
                isDisabled={isConfirmDisabled}
            >
                <Translation id="TR_CONFIRM" />
            </Modal.Button>
            <Modal.Button
                intent="neutral"
                priority="secondary"
                onClick={onCancel}
                data-testid="@tx-simulation-modal/cancel-button"
            >
                <Translation id="TR_CANCEL" />
            </Modal.Button>
        </>
    );
}
