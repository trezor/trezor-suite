import { selectSelectedDeviceLabelOrName } from '@suite-common/wallet-core';
import { Modal } from '@trezor/components';

import { Translation } from 'src/components/suite/Translation';
import { useSelector } from 'src/hooks/suite';

export const PinInvalidModal = ({ onCancel }: { onCancel: () => void }) => {
    const deviceLabel = useSelector(selectSelectedDeviceLabelOrName);

    return (
        <Modal.Backdrop>
            <Modal.ModalBase
                heading={<Translation id="TR_ENTERED_PIN_NOT_CORRECT" values={{ deviceLabel }} />}
                onCancel={onCancel}
                data-testid="@modal/pin"
                size="tiny"
                bottomContent={
                    <>
                        <Modal.Button onClick={onCancel} variant="tertiary">
                            <Translation id="TR_CANCEL" />
                        </Modal.Button>
                    </>
                }
            >
                Looks like you do not remember your PIN. Step away, take a deep breath and try again
                later. You may have noticed that pin processing time doubles after each invalid
                attempt.
            </Modal.ModalBase>
        </Modal.Backdrop>
    );
};
