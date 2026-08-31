import { useDispatch } from 'react-redux';

import { selectSelectedAccount } from '@suite/account';
import { stopCoinjoinSession } from '@suite/coinjoin';
import { Translation } from '@suite/intl';
import { Column, H3, Modal, Paragraph } from '@trezor/components';
import { ArrowsInIcon } from '@trezor/icons';

import { useSelector } from 'src/hooks/suite/useSelector';

type CancelCoinjoinModalProps = {
    onClose: () => void;
};

export const CancelCoinjoinModal = ({ onClose }: CancelCoinjoinModalProps) => {
    const account = useSelector(selectSelectedAccount);

    const dispatch = useDispatch();

    if (!account) {
        return null;
    }

    return (
        <Modal
            onCancel={onClose}
            intent="warning"
            icon={ArrowsInIcon}
            width={600}
            bottomContent={
                <>
                    <Modal.Button
                        onClick={() => {
                            dispatch(stopCoinjoinSession(account.key));
                            onClose();
                        }}
                    >
                        <Translation id="TR_CANCEL_COINJOIN_YES" />
                    </Modal.Button>
                    <Modal.Button intent="neutral" priority="secondary" onClick={onClose}>
                        <Translation id="TR_CANCEL_COINJOIN_NO" />
                    </Modal.Button>
                </>
            }
        >
            <Column gap={4}>
                <H3>
                    <Translation id="TR_CANCEL_COINJOIN" />
                </H3>
                <Paragraph intent="neutral" priority="secondary">
                    <Translation id="TR_CANCEL_COINJOIN_QUESTION" />
                </Paragraph>
            </Column>
        </Modal>
    );
};
