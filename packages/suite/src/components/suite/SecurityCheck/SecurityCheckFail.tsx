import styled from 'styled-components';

import { TranslationKey } from '@suite-common/intl-types';
import { Button, Divider, H2, Row, Text } from '@trezor/components';
import { spacings, spacingsPx } from '@trezor/theme';
import { Url } from '@trezor/urls';

import { Translation } from 'src/components/suite';
import { SecurityChecklist } from 'src/views/onboarding/steps/SecurityCheck/SecurityChecklist';
import { SecurityChecklistItem } from 'src/views/onboarding/steps/SecurityCheck/types';

import { SecurityCheckLayout } from './SecurityCheckLayout';
import { hardFailureChecklistItems } from './checklistItems';

const TopSection = styled.div`
    margin-top: ${spacingsPx.xs};
    margin-bottom: ${spacingsPx.xl};
    width: 100%;
`;

const Flex = styled.div`
    flex: 1;
`;

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
            <TopSection>
                <H2 margin={{ bottom: spacings.sm }}>
                    <Translation id={heading} />
                </H2>
                <Text variant="tertiary">
                    <Translation id={text} />
                </Text>
            </TopSection>
            <Divider margin={{ top: spacings.zero, bottom: spacings.xl }} />
            <SecurityChecklist items={checklistItems} />
            <Row flexWrap="wrap" gap={spacings.xl} width="100%">
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
                <Flex>
                    <Button href={chatUrl} isFullWidth size="large">
                        <Translation id="TR_CONTACT_TREZOR_SUPPORT" />
                    </Button>
                </Flex>
            </Row>
        </SecurityCheckLayout>
    );
};
