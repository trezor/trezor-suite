import { type Dispatch, type SetStateAction } from 'react';

import { Translation } from '@suite/intl';
import { Card, Checkbox, Column, H4, Paragraph } from '@trezor/components';
import { spacings } from '@trezor/theme';

type AdditionalBackupDisclaimerProps = {
    isChecked: boolean;
    setIsChecked: Dispatch<SetStateAction<boolean>>;
};

export const AdditionalBackupDisclaimer = ({
    isChecked,
    setIsChecked,
}: AdditionalBackupDisclaimerProps) => {
    const toggleCheckbox = () => setIsChecked(prev => !prev);

    return (
        <Column gap={spacings.lg}>
            <Column>
                <H4>
                    <Translation id="TR_CREATE_ADDITIONAL_BACKUP_HOW" />
                </H4>
                <Paragraph intent="neutral" priority="secondary">
                    <Translation id="TR_CREATE_ADDITIONAL_BACKUP_HOW_DESCRIPTION" />
                </Paragraph>
            </Column>
            <Column>
                <H4>
                    <Translation id="TR_CREATE_ADDITIONAL_BACKUP_CURRENT" />
                </H4>
                <Paragraph intent="neutral" priority="secondary">
                    <Translation id="TR_CREATE_ADDITIONAL_BACKUP_CURRENT_DESCRIPTION" />
                </Paragraph>
            </Column>
            <Card margin={{ top: spacings.xs }}>
                <Checkbox
                    isChecked={isChecked}
                    onChange={toggleCheckbox}
                    data-testid="@additional-backup/checkbox"
                >
                    <Translation id="TR_CREATE_ADDITIONAL_BACKUP_UNDERSTAND" />
                </Checkbox>
            </Card>
        </Column>
    );
};
