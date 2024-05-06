import { useState } from 'react';

import { Button, ModalProps } from '@trezor/components';
import { HELP_CENTER_MULTI_SHARE_BACKUP_URL, HELP_CENTER_SEED_CARD_URL } from '@trezor/urls';

import { useDispatch } from 'src/hooks/suite';
import { onCancel, openModal } from 'src/actions/suite/modalActions';
import { Modal, Translation } from 'src/components/suite';
import { LearnMoreButton } from 'src/components/suite/LearnMoreButton';
import { MultiShareBackupStep1 } from './MultiShareBackupStep1';
import { MultiShareBackupStep2 } from './MultiShareBackupStep2';

export const MultiShareBackupModal = () => {
    const dispatch = useDispatch();
    const [step, setStep] = useState<0 | 1>(0);
    const [isChecked1, setIsChecked1] = useState(false);
    const [isChecked2, setIsChecked2] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleClose = () => dispatch(onCancel());

    const getStepConfig = (): Partial<ModalProps> | undefined => {
        switch (step) {
            case 0:
                const goToStepNextStep = () => {
                    setIsSubmitted(true);
                    if (isChecked1 && isChecked2) {
                        setStep(1);
                    }
                };

                return {
                    heading: <Translation id="TR_CREATE_MULTI_SHARE_BACKUP" />,
                    children: (
                        <MultiShareBackupStep1
                            isChecked1={isChecked1}
                            isChecked2={isChecked2}
                            isSubmitted={isSubmitted}
                            setIsChecked1={setIsChecked1}
                            setIsChecked2={setIsChecked2}
                        />
                    ),
                    bottomBarComponents: (
                        <>
                            <Button onClick={goToStepNextStep}>
                                <Translation id="TR_CREATE_MULTI_SHARE_BACKUP" />
                            </Button>
                            <LearnMoreButton url={HELP_CENTER_SEED_CARD_URL} size="medium" />
                        </>
                    ),
                };
            case 1:
                const enterBackup = () => {
                    // Todo: HERE WILL BE THE TREZOR FLOW TO CREATE BACKUP

                    console.log('continue');

                    handleClose();
                    dispatch(openModal({ type: 'multi-share-backup-complete' }));
                };

                return {
                    heading: <Translation id="TR_NEXT_UP" />,
                    children: <MultiShareBackupStep2 />,
                    bottomBarComponents: (
                        <>
                            <Button onClick={enterBackup}>
                                <Translation id="TR_ENTER_EXISTING_BACKUP" />
                            </Button>
                            <LearnMoreButton url={HELP_CENTER_MULTI_SHARE_BACKUP_URL} size="medium">
                                <Translation id="TR_DONT_HAVE_BACKUP" />
                            </LearnMoreButton>
                        </>
                    ),
                    onBackClick: () => setStep(0),
                };
        }
    };

    return <Modal isCancelable onCancel={handleClose} {...getStepConfig()}></Modal>;
};
