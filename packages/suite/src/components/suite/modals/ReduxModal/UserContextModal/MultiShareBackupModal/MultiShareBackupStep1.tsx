import { Dispatch, SetStateAction } from 'react';

import { Translation } from '@suite/intl';
import { Card, Checkbox, Column, H4, Paragraph } from '@trezor/components';
import { spacings } from '@trezor/theme';

type MultiShareBackupStep1Props = {
    isChecked1: boolean;
    isChecked2: boolean;
    setIsChecked1: Dispatch<SetStateAction<boolean>>;
    setIsChecked2: Dispatch<SetStateAction<boolean>>;
};

export const MultiShareBackupStep1 = ({
    isChecked1,
    isChecked2,
    setIsChecked1,
    setIsChecked2,
}: MultiShareBackupStep1Props) => {
    const toggleCheckbox1 = () => setIsChecked1(prev => !prev);
    const toggleCheckbox2 = () => setIsChecked2(prev => !prev);

    return (
        <Column gap={spacings.lg}>
            <Column>
                <H4>
                    <Translation id="TR_MULTI_SHARE_BACKUP_CALLOUT_1" />
                </H4>
                <Paragraph intent="neutral" priority="secondary">
                    <Translation id="TR_MULTI_SHARE_BACKUP_EXPLANATION_1" />
                </Paragraph>
            </Column>
            <Column>
                <H4>
                    <Translation id="TR_MULTI_SHARE_BACKUP_CALLOUT_2" />
                </H4>
                <Paragraph intent="neutral" priority="secondary">
                    <Translation id="TR_MULTI_SHARE_BACKUP_EXPLANATION_2" />
                </Paragraph>
            </Column>
            <Card margin={{ top: spacings.xs }}>
                <Column gap={spacings.sm}>
                    <Checkbox
                        isChecked={isChecked1}
                        onChange={toggleCheckbox1}
                        data-testid="@multi-share-backup/checkbox/1"
                    >
                        <Translation id="TR_MULTI_SHARE_BACKUP_CHECKBOX_1" />
                    </Checkbox>
                    <Checkbox
                        isChecked={isChecked2}
                        onChange={toggleCheckbox2}
                        data-testid="@multi-share-backup/checkbox/2"
                    >
                        <Translation id="TR_MULTI_SHARE_BACKUP_CHECKBOX_2" />
                    </Checkbox>
                </Column>
            </Card>
        </Column>
    );
};
