import { Translation } from '@suite/intl';
import { OnboardingCard } from '@suite/onboarding-components';
import { Row } from '@trezor/components';

import { BackupAlternativeCard } from './BackupAlternativeCard';

interface NoNfcTagsProps {
    onFinishSetup: () => void;
    onCreateWordlistBackup: () => void;
    onBack: () => void;
}

export const NoNfcTags = ({ onFinishSetup, onCreateWordlistBackup, onBack }: NoNfcTagsProps) => (
    <OnboardingCard
        iconName="trezorBackup"
        heading={<Translation id="TR_NFC_BACKUP_NO_TAGS_HEADING" />}
        description={<Translation id="TR_NFC_BACKUP_NO_TAGS_DESCRIPTION" />}
        outerActions={
            <OnboardingCard.Button
                size="small"
                intent="neutral"
                priority="secondary"
                iconLeft="arrowLeft"
                onClick={onBack}
            >
                <Translation id="TR_BACK" />
            </OnboardingCard.Button>
        }
    >
        <Row gap={16}>
            <BackupAlternativeCard
                badge={<Translation id="TR_RECOMMENDED" />}
                badgeIntent="info"
                heading={<Translation id="TR_NFC_BACKUP_FINISH_AND_ORDER_HEADING" />}
                description={<Translation id="TR_NFC_BACKUP_FINISH_AND_ORDER_DESCRIPTION" />}
                buttonLabel={<Translation id="TR_CONTINUE_SETUP" />}
                onClick={onFinishSetup}
            />
            <BackupAlternativeCard
                badge={<Translation id="TR_NFC_BACKUP_ALTERNATIVE_BADGE" />}
                heading={<Translation id="TR_NFC_BACKUP_WORDLIST_HEADING" />}
                description={<Translation id="TR_NFC_BACKUP_WORDLIST_DESCRIPTION" />}
                buttonLabel={<Translation id="TR_NFC_BACKUP_WORDLIST_CTA" />}
                buttonIntent="neutral"
                buttonPriority="secondary"
                onClick={onCreateWordlistBackup}
            />
        </Row>
    </OnboardingCard>
);
