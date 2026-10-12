import { useEvent } from 'react-use';

import { Translation } from '@suite/intl';
import { Banner, H3, Modal, Paragraph } from '@trezor/components';
import { WarningCircleIcon } from '@trezor/icons';

type LeaveProgramModalProps = {
    onConfirm: () => void;
    onCancel: () => void;
};

export const LeaveProgramModal = ({ onConfirm, onCancel }: LeaveProgramModalProps) => {
    useEvent('keydown', (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
            onCancel();
        }
    });

    return (
        <Modal.Backdrop onClick={onCancel} data-testid="@referral/leave-modal/backdrop">
            <Modal.ModalBase
                width={600}
                intent="critical"
                icon={WarningCircleIcon}
                data-testid="@referral/leave-modal"
                bottomContent={
                    <>
                        <Modal.Button
                            onClick={onConfirm}
                            data-testid="@referral/leave-modal/confirm"
                        >
                            <Translation id="TR_REFERRAL_LEAVE_PROGRAM" />
                        </Modal.Button>
                        <Modal.Button
                            onClick={onCancel}
                            intent="neutral"
                            priority="secondary"
                            data-testid="@referral/leave-modal/cancel"
                        >
                            <Translation id="TR_CANCEL" />
                        </Modal.Button>
                    </>
                }
            >
                <H3 typographyStyle="headline-sm">
                    <Translation id="TR_REFERRAL_LEAVE_TITLE" />
                </H3>
                <Paragraph
                    typographyStyle="body-md"
                    intent="neutral"
                    priority="secondary"
                    margin={{ top: 4 }}
                >
                    <Translation id="TR_REFERRAL_LEAVE_DESCRIPTION" />
                </Paragraph>
                <Banner
                    intent="critical"
                    margin={{ top: 24 }}
                    description={<Translation id="TR_REFERRAL_LEAVE_VOUCHER_WARNING" />}
                />
            </Modal.ModalBase>
        </Modal.Backdrop>
    );
};
