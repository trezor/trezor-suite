import styled from 'styled-components';

import { OnboardingCard } from '@suite/onboarding-components';
import { Card, Column, H3, Row, Text } from '@trezor/components';

import { N4W1Tag } from './N4W1Tag';

type SelectBackupTypeProps = {
    onBack: () => void;
    onContinueWithN4W1: () => void;
    onContinueWithoutN4W1: () => void;
};

const TagRow = styled.div`
    display: flex;

    & > *:not(:first-child) {
        margin-left: -24px;
    }
`;

export const SelectBackupType = ({
    onBack,
    onContinueWithN4W1,
    onContinueWithoutN4W1,
}: SelectBackupTypeProps) => (
    <OnboardingCard
        iconName="trezorBackup"
        heading="Choose your wallet backup type"
        description="NFC wallet backup tags is the default backup type for your device."
        innerActions={
            <Row gap={12}>
                <OnboardingCard.Button onClick={onContinueWithN4W1}>
                    Continue with NFC backup
                </OnboardingCard.Button>
                <OnboardingCard.Button intent="neutral" onClick={onContinueWithoutN4W1}>
                    I don’t have backup tags
                </OnboardingCard.Button>
            </Row>
        }
        outerActions={
            <OnboardingCard.SecondaryButton onClick={onBack}>Back</OnboardingCard.SecondaryButton>
        }
    >
        <Card paddingType="large">
            <Column gap={32} alignItems="center">
                <Column alignItems="center">
                    <H3>NFC backup</H3>
                    <Text>Your wallet backup uses 3 Trezor backup tags.</Text>
                </Column>

                <TagRow>
                    <N4W1Tag />
                    <N4W1Tag />
                    <N4W1Tag />
                </TagRow>

                <Text intent="neutral">
                    Each tag stores 1 of the 3 unique shares of your wallet backup.
                </Text>
            </Column>
        </Card>
    </OnboardingCard>
);
