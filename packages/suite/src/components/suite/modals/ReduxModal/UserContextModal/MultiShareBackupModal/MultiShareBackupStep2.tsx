import styled from 'styled-components';

import { Columns, Image, Text } from '@trezor/components';
import { borders, spacings, spacingsPx } from '@trezor/theme';
import { ESHOP_KEEP_METAL_URL, HELP_CENTER_SEED_CARD_URL } from '@trezor/urls';

import { Translation, TrezorLink } from 'src/components/suite';
import { BackupInstructionsCard } from './BackupInstructionsCard';
import { BackupInstructionsStep, BackupInstructionsStepProps } from './BackupInstructionsStep';

const CardWrapper = styled.div`
    display: grid;
    gap: ${spacingsPx.sm};
    grid-template-columns: repeat(3, 1fr);
`;

const Illustration = styled.div`
    display: flex;
    align-items: center;
    flex-direction: column;
    border: ${borders.widths.small} solid ${({ theme }) => theme.borderElevation0};
    border-radius: ${borders.radii.md};
    padding-bottom: ${spacingsPx.lg};
`;

export const MultiShareBackupStep2 = () => {
    const instructions: Pick<
        BackupInstructionsStepProps,
        'children' | 'description' | 'heading' | 'time'
    >[] = [
        {
            heading: 'TR_VERIFY_TREZOR_OWNERSHIP',
            time: 2,
            description: 'TR_VERIFY_TREZOR_OWNERSHIP_EXPLANATION',
            children: (
                <Columns gap={spacings.sm}>
                    <BackupInstructionsCard isHorizontal icon="BACKUP_2">
                        <Translation id="TR_VERIFY_TREZOR_OWNERSHIP_CARD_1" />
                    </BackupInstructionsCard>
                    <BackupInstructionsCard isHorizontal icon="CAMERA_SLASH">
                        <Translation id="TR_VERIFY_TREZOR_OWNERSHIP_CARD_2" />
                    </BackupInstructionsCard>
                </Columns>
            ),
        },
        {
            heading: 'TR_CREATE_SHARES',
            time: 10,
            description: 'TR_CREATE_SHARES_EXPLANATION',
            children: (
                <>
                    <Illustration>
                        <Image image="SHAMIR_SHARES" />
                        <Text typographyStyle="hint" variant="tertiary">
                            <Translation id="TR_CREATE_SHARES_EXAMPLE" />
                        </Text>
                    </Illustration>
                    <CardWrapper>
                        <BackupInstructionsCard icon="PENCIL">
                            <Translation
                                id="TR_CREATE_SHARES_CARD_1"
                                values={{
                                    cardsLink: chunks => (
                                        <TrezorLink
                                            href={HELP_CENTER_SEED_CARD_URL}
                                            variant="underline"
                                        >
                                            {chunks}
                                        </TrezorLink>
                                    ),
                                    keepLink: chunks => (
                                        <TrezorLink href={ESHOP_KEEP_METAL_URL} variant="underline">
                                            {chunks}
                                        </TrezorLink>
                                    ),
                                }}
                            />
                        </BackupInstructionsCard>
                        <BackupInstructionsCard icon="CAMERA_SLASH">
                            <Translation id="TR_CREATE_SHARES_CARD_2" />
                        </BackupInstructionsCard>
                        <BackupInstructionsCard icon="EYE_SLASH">
                            <Translation id="TR_CREATE_SHARES_CARD_3" />
                        </BackupInstructionsCard>
                    </CardWrapper>
                </>
            ),
        },
    ];

    return instructions.map((content, i) => (
        <BackupInstructionsStep
            key={i}
            stepNumber={i + 1}
            isLast={instructions.length === i + 1}
            {...content}
        />
    ));
};
