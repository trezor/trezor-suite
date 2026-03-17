import { OnboardingCard } from '@suite/onboarding-components';
import { Row } from '@trezor/components';

import { BackupOptionCard } from './BackupOptionCard';

export const NoN4W1Tags = () => (
    <OnboardingCard
        iconName="trezorBackup"
        heading="Don’t have NFC backup tags?"
        description="You can finish setup now and create your wallet backup later."
    >
        <Row gap={16}>
            <BackupOptionCard
                badge="Recommended"
                badgeIntent="info"
                heading="Finish setup and order tags"
                description="Finish setting up your device. Then you’ll be redirected to the Trezor Store to order NFC backup tags. Create your wallet backup once they arrive."
                buttonLabel="Finish setup"
            />
            <BackupOptionCard
                badge="Alternative"
                heading="Create wordlist backup"
                description="Write down one or more 20-word wordlists (shares) on paper or metal. You can upgrade to NFC backup later."
                buttonLabel="Create wordlist backup"
                buttonIntent="neutral"
                buttonPriority="secondary"
            />
        </Row>
    </OnboardingCard>
);
