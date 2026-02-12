import { Translation } from '@suite/intl';
import { selectSelectedDeviceLabelOrName } from '@suite-common/device';
import { Modal } from '@trezor/components';

import { useSelector } from 'src/hooks/suite';

export const PinInvalidModal = ({ onCancel }: { onCancel: () => void }) => {
    const deviceLabel = useSelector(selectSelectedDeviceLabelOrName);

    return (
        <Modal.Backdrop>
            <Modal.ModalBase
                heading={<Translation id="TR_ENTERED_PIN_NOT_CORRECT" values={{ deviceLabel }} />}
                onCancel={onCancel}
                data-testid="@modal/pin"
                width={400}
                bottomContent={
                    <>
                        <Modal.Button onClick={onCancel} intent="neutral" priority="secondary">
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
