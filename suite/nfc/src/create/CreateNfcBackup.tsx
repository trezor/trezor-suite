import styled from 'styled-components';

import { Translation } from '@suite/intl';
import { OnboardingCard } from '@suite/onboarding-components';
import { Card, Column, Text } from '@trezor/components';
import { CaretLeftIcon, TrezorBackupIcon } from '@trezor/icons';

import { NfcTag } from '../tags/NfcTag';

const TagRow = styled.div`
    display: flex;
    gap: 8px;
    filter: drop-shadow(0px 8px 16px rgba(0, 0, 0, 0.16));
`;
interface CreateNfcBackupProps {
    onBack: () => void;
    onCreateBackup: () => void;
}

export const CreateNfcBackup = ({ onBack, onCreateBackup }: CreateNfcBackupProps) => (
    <OnboardingCard
        icon={TrezorBackupIcon}
        heading={<Translation id="TR_NFC_BACKUP_HEADING" />}
        innerActions={
            <OnboardingCard.Button onClick={onCreateBackup}>
                <Translation id="TR_CREATE_BACKUP" />
            </OnboardingCard.Button>
        }
        outerActions={
            <OnboardingCard.SecondaryButton iconLeft={CaretLeftIcon} onClick={onBack}>
                <Translation id="TR_BACK" />
            </OnboardingCard.SecondaryButton>
        }
    >
        <Column alignItems="center">
            <Card paddingType="large" type="contrast" maxWidth={530}>
                <Column gap={32} alignItems="center">
                    <Text typographyStyle="headline-sm" align="center">
                        <Translation id="TR_NFC_BACKUP_RESILIENCE" />
                    </Text>
                    <TagRow>
                        <NfcTag active />
                        <NfcTag active />
                        <NfcTag />
                    </TagRow>
                    <Text
                        typographyStyle="body-sm"
                        intent="neutral"
                        priority="secondary"
                        align="center"
                    >
                        <Translation id="TR_NFC_BACKUP_THRESHOLD_DESCRIPTION" />
                    </Text>
                </Column>
            </Card>
        </Column>
    </OnboardingCard>
);
