import { TranslationKey } from '@suite-common/intl-types';
import { Button, Column, Divider, H2, Paragraph, Row } from '@trezor/components';
import { spacings } from '@trezor/theme';
import { Url } from '@trezor/urls';

import { Translation } from 'src/components/suite';
import { SecurityChecklist } from 'src/views/onboarding/steps/SecurityCheck/SecurityChecklist';
import { SecurityChecklistItem } from 'src/views/onboarding/steps/SecurityCheck/types';

import { SecurityCheckLayout } from './SecurityCheckLayout';
import { hardFailureChecklistItems } from './checklistItems';

export type SecurityCheckFailProps = {
    goBack?: () => void;
    heading?: TranslationKey;
    text?: TranslationKey;
    supportUrl: Url;
    checklistItems?: SecurityChecklistItem[];
};

export const SecurityCheckFail = ({
    goBack,
    heading = 'TR_DEVICE_COMPROMISED_HEADING',
    text = 'TR_DEVICE_COMPROMISED_TEXT',
    supportUrl,
    checklistItems = hardFailureChecklistItems,
}: SecurityCheckFailProps) => {
    const chatUrl = `${supportUrl}#open-chat`;

    return (
        <SecurityCheckLayout isFailed>
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
                {goBack && (
                    <Button
                        variant="tertiary"
                        onClick={goBack}
                        size="large"
                        data-testid="@device-compromised/back-button"
                    >
                        <Translation id="TR_BACK" />
                    </Button>
                )}
                <Button textWrap={false} href={chatUrl} isFullWidth size="large" flex="1">
                    <Translation id="TR_CONTACT_TREZOR_SUPPORT" />
                </Button>
            </Row>
        </SecurityCheckLayout>
    );
};
