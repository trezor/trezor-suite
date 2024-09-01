import { Dispatch, SetStateAction } from 'react';
import styled from 'styled-components';

import { Checkbox, Image, Paragraph } from '@trezor/components';
import { spacingsPx } from '@trezor/theme';

import { Translation } from 'src/components/suite';
import { Body, Section } from './multiShareModalLayout';

// eslint-disable-next-line local-rules/no-override-ds-component
const StyledImage = styled(Image)`
    margin-bottom: ${spacingsPx.md};
`;

type MultiShareBackupStep1Props = {
    isChecked1: boolean;
    isChecked2: boolean;
    isSubmitted: boolean;
    setIsChecked1: Dispatch<SetStateAction<boolean>>;
    setIsChecked2: Dispatch<SetStateAction<boolean>>;
};

export const MultiShareBackupStep1FirstInfo = ({
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
        <>
            <StyledImage image="CREATE_SHAMIR_GROUP" />
            <Body>
                <Section>
                    <Paragraph typographyStyle="callout">
                        <Translation id="TR_MULTI_SHARE_BACKUP_CALLOUT_1" />
                    </Paragraph>
                    <Translation id="TR_MULTI_SHARE_BACKUP_EXPLANATION_1" />
                </Section>
                <Section>
                    <Paragraph typographyStyle="callout">
                        <Translation id="TR_MULTI_SHARE_BACKUP_CALLOUT_2" />
                    </Paragraph>
                    <Translation id="TR_MULTI_SHARE_BACKUP_EXPLANATION_2" />
                </Section>
                <Section>
                    <Paragraph typographyStyle="callout">
                        <Translation id="TR_MULTI_SHARE_BACKUP_CALLOUT_3" />
                    </Paragraph>
                    <Checkbox
                        isChecked={isChecked1}
                        onClick={toggleCheckbox1}
                        variant={checkboxVariant1}
                    >
                        <Translation id="TR_MULTI_SHARE_BACKUP_CHECKBOX_1" />
                    </Checkbox>
                    <Checkbox
                        isChecked={isChecked2}
                        onClick={toggleCheckbox2}
                        variant={checkboxVariant2}
                    >
                        <Translation id="TR_MULTI_SHARE_BACKUP_CHECKBOX_2" />
                    </Checkbox>
                </Section>
            </Body>
        </>
    );
};
