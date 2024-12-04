import { Dispatch, SetStateAction } from 'react';

import { Checkbox, Paragraph, Card, Column, H4 } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { Translation } from 'src/components/suite';

type MultiShareBackupStep1Props = {
    isChecked1: boolean;
    isChecked2: boolean;
    isSubmitted: boolean;
    setIsChecked1: Dispatch<SetStateAction<boolean>>;
    setIsChecked2: Dispatch<SetStateAction<boolean>>;
};

export const MultiShareBackupStep1 = ({
    isChecked1,
    isChecked2,
    isSubmitted,
    setIsChecked1,
    setIsChecked2,
}: MultiShareBackupStep1Props) => {
    const getCheckboxVariant = (isChecked: boolean) =>
        isSubmitted && !isChecked ? 'destructive' : undefined;

    const checkboxVariant1 = getCheckboxVariant(isChecked1);
    const checkboxVariant2 = getCheckboxVariant(isChecked2);

    const toggleCheckbox1 = () => setIsChecked1(prev => !prev);
    const toggleCheckbox2 = () => setIsChecked2(prev => !prev);

    return (
        <Column gap={spacings.lg}>
            <Column>
                <H4>
                    <Translation id="TR_MULTI_SHARE_BACKUP_CALLOUT_1" />
                </H4>
                <Paragraph variant="tertiary">
                    <Translation id="TR_MULTI_SHARE_BACKUP_EXPLANATION_1" />
                </Paragraph>
            </Column>
            <Column>
                <H4>
                    <Translation id="TR_MULTI_SHARE_BACKUP_CALLOUT_2" />
                </H4>
                <Paragraph variant="tertiary">
                    <Translation id="TR_MULTI_SHARE_BACKUP_EXPLANATION_2" />
                </Paragraph>
            </Column>
            <Card margin={{ top: spacings.xs }}>
                <Column gap={spacings.sm}>
                    <Checkbox
                        isChecked={isChecked1}
                        onClick={toggleCheckbox1}
                        variant={checkboxVariant1}
                        data-testid="@multi-share-backup/checkbox/1"
                    >
                        <Translation id="TR_MULTI_SHARE_BACKUP_CHECKBOX_1" />
                    </Checkbox>
                    <Checkbox
                        isChecked={isChecked2}
                        onClick={toggleCheckbox2}
                        variant={checkboxVariant2}
                        data-testid="@multi-share-backup/checkbox/2"
                    >
                        <Translation id="TR_MULTI_SHARE_BACKUP_CHECKBOX_2" />
                    </Checkbox>
                </Column>
            </Card>
        </Column>
    );
};
