import styled from 'styled-components';

import { Translation } from '@suite/intl';
import { OnboardingCard } from '@suite/onboarding-components';
import { Column, Row, Text } from '@trezor/components';

import { NfcTag } from './NfcTag';

type SelectBackupTypeProps = {
    onBack: () => void;
    onContinueWithNfc: () => void;
    onContinueWithoutNfc: () => void;
};

const TagRow = styled.div`
    display: flex;

    & > *:not(:first-child) {
        margin-left: -24px;
    }
`;

export const SelectBackupType = ({
    onBack,
    onContinueWithNfc,
    onContinueWithoutNfc,
}: SelectBackupTypeProps) => (
    <OnboardingCard
        iconName="trezorBackup"
        heading={<Translation id="TR_WALLET_BACKUP_TYPE" />}
        innerActions={
            <Row gap={12}>
                <OnboardingCard.Button onClick={onContinueWithNfc}>
                    <Translation id="TR_NFC_BACKUP_CONTINUE_WITH_NFC" />
                </OnboardingCard.Button>
                <OnboardingCard.Button
                    intent="neutral"
                    priority="secondary"
                    onClick={onContinueWithoutNfc}
                >
                    <Translation id="TR_NFC_BACKUP_CHOOSE_DIFFERENT_TYPE" />
                </OnboardingCard.Button>
            </Row>
        }
        outerActions={
            <OnboardingCard.SecondaryButton iconLeft="caretLeft" onClick={onBack}>
                <Translation id="TR_BACK" />
            </OnboardingCard.SecondaryButton>
        }
    >
        <Column>
            <Column gap={32} alignItems="center">
                <TagRow>
                    <NfcTag />
                    <NfcTag />
                    <NfcTag />
                </TagRow>

                <Column alignItems="center">
                    <Text intent="neutral">
                        <Translation id="TR_NFC_BACKUP_THREE_TAGS" />
                    </Text>
                    <Text intent="neutral" priority="secondary">
                        <Translation id="TR_NFC_BACKUP_THREE_TAGS_DESCRIPTION" />
                    </Text>
                </Column>
            </Column>
        </Column>
    </OnboardingCard>
);
