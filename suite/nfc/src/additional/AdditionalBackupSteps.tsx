import { Translation } from '@suite/intl';
import { BulletList, Paragraph } from '@trezor/components';
import { spacings } from '@trezor/theme';

type AdditionalBackupStep = 'verify-ownership' | 'backup';

type AdditionalBackupStepsProps = {
    step: AdditionalBackupStep;
};

export const AdditionalBackupSteps = ({ step }: AdditionalBackupStepsProps) => (
    <BulletList isOrdered margin={{ top: spacings.md }}>
        <BulletList.Item
            title={<Translation id="TR_VERIFY_TREZOR_OWNERSHIP" />}
            state={step === 'backup' ? 'done' : 'active'}
        >
            <Paragraph intent="neutral" priority="secondary">
                <Translation id="TR_VERIFY_TREZOR_OWNERSHIP_EXPLANATION" />
            </Paragraph>
        </BulletList.Item>
        <BulletList.Item
            title={<Translation id="TR_CREATE_ADDITIONAL_BACKUP_CREATE_STEP" />}
            state={step === 'verify-ownership' ? 'pending' : 'default'}
        >
            <Paragraph intent="neutral" priority="secondary">
                <Translation id="TR_CREATE_ADDITIONAL_BACKUP_CREATE_STEP_DESCRIPTION" />
            </Paragraph>
        </BulletList.Item>
    </BulletList>
);
