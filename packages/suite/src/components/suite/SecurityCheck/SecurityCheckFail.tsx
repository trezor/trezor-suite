import { type ReactNode } from 'react';

import { Translation, type TranslationKey } from '@suite/intl';
import { Column, Divider, H2, Paragraph } from '@trezor/components';
import { breakpoints } from '@trezor/theme';

import { ContentFlex } from 'src/support/suite/ContentFlex';
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
        <Column gap={12} padding={{ top: 8 }}>
            <H2>
                <Translation id={heading} />
            </H2>
            <Paragraph intent="neutral" priority="secondary">
                <Translation id={text} />
            </Paragraph>
        </Column>
        <Divider margin={{ vertical: 32 }} />
        <SecurityChecklist items={checklistItems} />
        <ContentFlex
            breakpoint={breakpoints.tablet}
            alignItems="center"
            gap={12}
            margin={{ top: 48 }}
            width="100%"
        >
            {ctaSection}
        </ContentFlex>
    </SecurityCheckLayout>
);
