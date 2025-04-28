import { ReactNode } from 'react';

import { TranslationKey } from '@suite-common/intl-types';
import { Column, Divider, H2, Paragraph, Row } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { Translation } from 'src/components/suite';
import { SecurityChecklist } from 'src/views/onboarding/steps/SecurityCheck/SecurityChecklist';
import { SecurityChecklistItem } from 'src/views/onboarding/steps/SecurityCheck/types';

import { SecurityCheckLayout } from './SecurityCheckLayout';
import { hardFailureChecklistItems } from './checklistItems';

type SecurityCheckFailProps = {
    ctaSection: ReactNode;
    heading?: TranslationKey;
    text?: TranslationKey;
    checklistItems?: SecurityChecklistItem[];
    useCompromisedImage?: boolean;
};

export const SecurityCheckFail = ({
    heading = 'TR_DEVICE_COMPROMISED_HEADING',
    text = 'TR_DEVICE_COMPROMISED_TEXT',
    ctaSection,
    checklistItems = hardFailureChecklistItems,
    useCompromisedImage = true,
}: SecurityCheckFailProps) => (
    <SecurityCheckLayout isFailed={useCompromisedImage}>
        <Column gap={spacings.sm} padding={{ top: spacings.xs }}>
            <H2>
                <Translation id={heading} />
            </H2>
            <Paragraph variant="tertiary">
                <Translation id={text} />
            </Paragraph>
        </Column>
        <Divider margin={{ vertical: spacings.xl }} />
        <SecurityChecklist items={checklistItems} />
        <Row flexWrap="wrap" gap={spacings.xl} width="100%" margin={{ top: spacings.xxxxl }}>
            {ctaSection}
        </Row>
    </SecurityCheckLayout>
);
