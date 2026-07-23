import { Translation } from '@suite/intl';
import { Column, H3, IconCircle, Paragraph } from '@trezor/components';
import { CheckIcon } from '@trezor/icons';
export const AdditionalBackupSuccess = () => (
    <Column gap={20} alignItems="start">
        <IconCircle icon={CheckIcon} size={96} intent="brand" />
        <Column>
            <H3>
                <Translation id="TR_WALLET_BACKUP_CREATED" />
            </H3>
            <Paragraph intent="neutral" priority="secondary">
                <Translation id="TR_WALLET_BACKUP_CREATED_DESCRIPTION" />
            </Paragraph>
        </Column>
    </Column>
);
