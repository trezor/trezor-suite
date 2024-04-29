import { useState } from 'react';
import styled from 'styled-components';

import { Button, Checkbox, Image, ModalProps, Paragraph, Text } from '@trezor/components';
import { borders, spacingsPx } from '@trezor/theme';
import {
    ESHOP_KEEP_METAL_20_URL,
    HELP_CENTER_RECOVERY_ISSUES_URL,
    HELP_CENTER_RECOVERY_SEED_URL,
} from '@trezor/urls';

import { useDispatch } from 'src/hooks/suite';
import { onCancel } from 'src/actions/suite/modalActions';
import { Modal, Translation, TrezorLink } from 'src/components/suite';
import { LearnMoreButton } from 'src/components/suite/LearnMoreButton';
import { BackupInstructionsCard } from './BackupInstructionsCard';
import { BackupInstructionsStep, BackupInstructionsStepProps } from './BackupInstructionsStep';

const StyledImage = styled(Image)`
    margin-bottom: ${spacingsPx.md};
`;

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
`;

const Body = styled(Wrapper)`
    gap: ${spacingsPx.lg};
`;

const Section = styled(Wrapper)`
    gap: ${spacingsPx.xs};
`;

const CardWrapper = styled.div`
    display: flex;
    gap: ${spacingsPx.sm};
`;

const Illustration = styled.div`
    display: flex;
    align-items: center;
    flex-direction: column;
    border: ${borders.widths.small} solid ${({ theme }) => theme.borderElevation0};
    border-radius: ${borders.radii.md};
    padding-bottom: ${spacingsPx.lg};
`;

const CardWrapper2 = styled.div`
    display: grid;
    gap: ${spacingsPx.sm};
    grid-template-columns: repeat(3, 1fr);
`;

export const MultiShareBackupModal = () => {
    const dispatch = useDispatch();
    const [step, setStep] = useState<0 | 1>(0);
    const [isChecked1, setIsChecked1] = useState(false);
    const [isChecked2, setIsChecked2] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleClose = () => dispatch(onCancel());

    const getStepConfig = (): Partial<ModalProps> | undefined => {
        switch (step) {
            case 0:
                const getCheckboxVariant = (isChecked: boolean) =>
                    isSubmitted && !isChecked ? 'destructive' : undefined;

                const checkboxVariant1 = getCheckboxVariant(isChecked1);
                const checkboxVariant2 = getCheckboxVariant(isChecked2);

                const toggleCheckbox1 = () => setIsChecked1(prev => !prev);
                const toggleCheckbox2 = () => setIsChecked2(prev => !prev);
                const goToStepNextStep = () => {
                    setIsSubmitted(true);
                    if (isChecked1 && isChecked2) {
                        setStep(1);
                    }
                };

                return {
                    heading: <Translation id="TR_CREATE_MULTI_SHARE_BACKUP" />,
                    children: (
                        <>
                            <StyledImage image="CREATE_SHAMIR_GROUP" />
                            <Body>
                                <Section>
                                    <Paragraph typographyStyle="callout">
                                        <Translation id="TR_MULTI_SHARE_BACKUP_CALLOUT_1" />
                                    </Paragraph>
                                    <Translation id="TR_MULTI_SHARE_BACKUP_EXPLANATION_1" />
                                </Section>
                                <Section>
                                    <Paragraph typographyStyle="callout">
                                        <Translation id="TR_MULTI_SHARE_BACKUP_CALLOUT_2" />
                                    </Paragraph>
                                    <Translation id="TR_MULTI_SHARE_BACKUP_EXPLANATION_2" />
                                </Section>
                                <Section>
                                    <Paragraph typographyStyle="callout">
                                        <Translation id="TR_MULTI_SHARE_BACKUP_CALLOUT_3" />
                                    </Paragraph>
                                    <Checkbox
                                        isChecked={isChecked1}
                                        onClick={toggleCheckbox1}
                                        variant={checkboxVariant1}
                                    >
                                        <Translation id="TR_MULTI_SHARE_BACKUP_CHECKBOX_1" />
                                    </Checkbox>
                                    <Checkbox
                                        isChecked={isChecked2}
                                        onClick={toggleCheckbox2}
                                        variant={checkboxVariant2}
                                    >
                                        <Translation id="TR_MULTI_SHARE_BACKUP_CHECKBOX_2" />
                                    </Checkbox>
                                </Section>
                            </Body>
                        </>
                    ),
                    bottomBarComponents: (
                        <>
                            <Button onClick={goToStepNextStep}>
                                <Translation id="TR_CREATE_MULTI_SHARE_BACKUP" />
                            </Button>
                            <LearnMoreButton url={HELP_CENTER_RECOVERY_SEED_URL} size="medium" />
                            {/*TODO: replace link*/}
                        </>
                    ),
                };
            case 1:
                const enterBackup = () => console.log('continue');

                const instructionsSteps: Pick<
                    BackupInstructionsStepProps,
                    'children' | 'description' | 'heading' | 'time'
                >[] = [
                    {
                        heading: 'TR_VERIFY_TREZOR_OWNERSHIP',
                        time: 2,
                        description: 'TR_VERIFY_TREZOR_OWNERSHIP_EXPLANATION',
                        children: (
                            <CardWrapper>
                                <BackupInstructionsCard isHorizontal icon="BACKUP_2">
                                    <Translation id="TR_VERIFY_TREZOR_OWNERSHIP_CARD_1" />
                                </BackupInstructionsCard>
                                <BackupInstructionsCard isHorizontal icon="CAMERA_SLASH">
                                    <Translation id="TR_VERIFY_TREZOR_OWNERSHIP_CARD_2" />
                                </BackupInstructionsCard>
                            </CardWrapper>
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
                                <CardWrapper2>
                                    <BackupInstructionsCard icon="PENCIL">
                                        <Translation
                                            id="TR_CREATE_SHARES_CARD_1"
                                            values={{
                                                a1: chunks => (
                                                    <TrezorLink
                                                        href={ESHOP_KEEP_METAL_20_URL}
                                                        variant="underline"
                                                    >
                                                        {/*TODO: replace link*/}
                                                        {chunks}
                                                    </TrezorLink>
                                                ),
                                                a2: chunks => (
                                                    <TrezorLink
                                                        href={ESHOP_KEEP_METAL_20_URL}
                                                        variant="underline"
                                                    >
                                                        {/*TODO: check link didn't change*/}
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
                                </CardWrapper2>
                            </>
                        ),
                    },
                ];

                return {
                    heading: <Translation id="TR_NEXT_UP" />,
                    children: instructionsSteps.map((content, i) => (
                        <BackupInstructionsStep
                            key={i}
                            stepNumber={i + 1}
                            isLast={instructionsSteps.length === i + 1}
                            {...content}
                        />
                    )),
                    bottomBarComponents: (
                        <>
                            <Button onClick={enterBackup}>
                                <Translation id="TR_ENTER_EXISTING_BACKUP" />
                            </Button>
                            <LearnMoreButton url={HELP_CENTER_RECOVERY_ISSUES_URL} size="medium">
                                <Translation id="TR_DONT_HAVE_BACKUP" />
                            </LearnMoreButton>
                        </>
                    ),
                    onBackClick: () => setStep(0),
                };
        }
    };

    return <Modal isCancelable onCancel={handleClose} {...getStepConfig()}></Modal>;
};
