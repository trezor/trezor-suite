import { Translation } from '@suite/intl';
import { Paragraph, StepList } from '@trezor/components';
type AdditionalBackupStep = 'verify-ownership' | 'backup';

type AdditionalBackupStepsProps = {
    step: AdditionalBackupStep;
};

export const AdditionalBackupSteps = ({ step }: AdditionalBackupStepsProps) => (
    <StepList isOrdered margin={{ top: 16 }}>
        <StepList.Item
            title={<Translation id="TR_VERIFY_TREZOR_OWNERSHIP" />}
            state={step === 'backup' ? 'done' : 'active'}
        >
            <Paragraph intent="neutral" priority="secondary">
                <Translation id="TR_VERIFY_TREZOR_OWNERSHIP_EXPLANATION" />
            </Paragraph>
        </StepList.Item>
        <StepList.Item
            title={<Translation id="TR_CREATE_ADDITIONAL_BACKUP_CREATE_STEP" />}
            state={step === 'verify-ownership' ? 'pending' : 'default'}
        >
            <Paragraph intent="neutral" priority="secondary">
                <Translation id="TR_CREATE_ADDITIONAL_BACKUP_CREATE_STEP_DESCRIPTION" />
            </Paragraph>
        </StepList.Item>
    </StepList>
);
