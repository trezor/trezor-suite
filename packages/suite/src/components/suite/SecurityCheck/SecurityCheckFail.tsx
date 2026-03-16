import { type ReactNode } from 'react';

import { Translation, type TranslationKey } from '@suite/intl';
import { Column, Divider, H2, Paragraph, Row } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { SecurityChecklist } from 'src/views/onboarding/steps/DeviceAuthenticityStep/SecurityChecklist';
import { type SecurityChecklistItem } from 'src/views/onboarding/steps/DeviceAuthenticityStep/types';

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
            <Paragraph intent="neutral" priority="secondary">
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
