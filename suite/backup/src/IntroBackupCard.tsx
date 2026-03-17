import { Translation } from '@suite/intl';
import { OnboardingCard } from '@suite/onboarding-components';

type IntroBackupCardProps = {
    onContinue: () => void;
};

// TODO add skip wallet backup button
export const IntroBackupCard = ({ onContinue }: IntroBackupCardProps) => (
    <OnboardingCard
        iconName="trezorBackup"
        heading={<Translation id="TR_CREATE_BACKUP" />}
        description={<Translation id="TR_ONBOARDING_BACKUP_SUBHEADING" />}
        innerActions={
            <OnboardingCard.Button onClick={onContinue}>
                <Translation id="TR_CONTINUE" />
            </OnboardingCard.Button>
        }
    />
);
