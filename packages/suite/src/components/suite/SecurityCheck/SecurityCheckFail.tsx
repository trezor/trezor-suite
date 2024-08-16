import styled from 'styled-components';

import { H2, Row, Text, useElevation } from '@trezor/components';
import { Elevation, mapElevationToBorder, spacings, spacingsPx } from '@trezor/theme';
import { TREZOR_SUPPORT_FW_CHECK_FAILED } from '@trezor/urls';

import { Translation, TrezorLink } from 'src/components/suite';
import { SecurityChecklist } from '../../../views/onboarding/steps/SecurityCheck/SecurityChecklist';
import { SecurityCheckButton } from '../../../views/onboarding/steps/SecurityCheck/SecurityCheckButton';
import { SecurityCheckLayout } from './SecurityCheckLayout';

const TopSection = styled.div<{ $elevation: Elevation }>`
    border-bottom: 1px solid ${mapElevationToBorder};
    margin-top: ${spacingsPx.xs};
    padding-bottom: ${spacingsPx.xl};
    width: 100%;
`;

const StyledTrezorLink = styled(TrezorLink)`
    /* flex-grow has no effect on a link, display is set to contents so that it can be read from the child */
    display: contents;
`;

const StyledSecurityCheckButton = styled(SecurityCheckButton)`
    flex-grow: 1;
`;

const checklistItems = [
    {
        icon: 'plugs',
        content: <Translation id="TR_DISCONNECT_DEVICE" />,
    },
    {
        icon: 'hand',
        content: <Translation id="TR_AVOID_USING_DEVICE" />,
    },
    {
        icon: 'chat',
        content: <Translation id="TR_USE_CHAT" values={{ b: chunks => <b>{chunks}</b> }} />,
    },
] as const;

const supportChatUrl = `${TREZOR_SUPPORT_FW_CHECK_FAILED}#open-chat`;

interface SecurityCheckFailProps {
    goBack?: () => void;
    useSoftMessaging?: boolean;
}

export const SecurityCheckFail = ({ goBack, useSoftMessaging }: SecurityCheckFailProps) => {
    const heading = useSoftMessaging
        ? 'TR_DEVICE_COMPROMISED_HEADING_SOFT'
        : 'TR_DEVICE_COMPROMISED_HEADING';
    const text = useSoftMessaging
        ? 'TR_DEVICE_COMPROMISED_TEXT_SOFT'
        : 'TR_DEVICE_COMPROMISED_TEXT';

    const { elevation } = useElevation();

    return (
        <SecurityCheckLayout isFailed>
            <TopSection $elevation={elevation}>
                <H2>
                    <Translation id={heading} />
                </H2>
                <Text variant="tertiary">
                    <Translation id={text} />
                </Text>
            </TopSection>
            <SecurityChecklist items={checklistItems} />
            <Row flexWrap="wrap" gap={spacings.xl} width="100%">
                {goBack && (
                    <StyledSecurityCheckButton variant="tertiary" onClick={goBack}>
                        <Translation id="TR_BACK" />
                    </StyledSecurityCheckButton>
                )}
                <StyledTrezorLink variant="nostyle" href={supportChatUrl}>
                    <StyledSecurityCheckButton>
                        <Translation id="TR_CONTACT_TREZOR_SUPPORT" />
                    </StyledSecurityCheckButton>
                </StyledTrezorLink>
            </Row>
        </SecurityCheckLayout>
    );
};
