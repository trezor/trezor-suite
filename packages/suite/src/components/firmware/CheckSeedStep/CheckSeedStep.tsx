import { useState } from 'react';

import styled from 'styled-components';

import { Button, Checkbox, Column, variables } from '@trezor/components';
import { spacings, spacingsPx } from '@trezor/theme';
import { selectSelectedDeviceLabelOrName } from '@suite-common/wallet-core';

import { useDevice, useSelector } from 'src/hooks/suite';
import { Translation } from 'src/components/suite';
import { OnboardingStepBox } from 'src/components/onboarding';

import { FirmwareButtonsRow } from '../Buttons/FirmwareButtonsRow';
import { FirmwareSwitchWarning } from '../FirmwareSwitchWarning';
import { FirmwareInstallationBackupButton } from './FirmwareInstallationBackupButton';

const StyledSwitchWarning = styled(FirmwareSwitchWarning)`
    align-self: flex-start;
    border-bottom: 1px solid ${({ theme }) => theme.legacy.STROKE_GREY};
    color: ${({ theme }) => theme.legacy.TYPE_DARK_GREY};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    margin: ${spacingsPx.xs} ${spacingsPx.md};
    padding-bottom: ${spacingsPx.md};
    text-transform: uppercase;
`;

type CheckSeedStepProps = {
    deviceWillBeWiped: boolean;
    onClose?: () => void;
    onSuccess: () => void;
};

export const CheckSeedStep = ({ deviceWillBeWiped, onClose, onSuccess }: CheckSeedStepProps) => {
    const deviceLabel = useSelector(selectSelectedDeviceLabelOrName);
    const { device } = useDevice();
    const [isChecked, setIsChecked] = useState(false);

    const isBackedUp =
        device?.features?.backup_availability !== 'Required' &&
        !device?.features?.unfinished_backup;

    const handleCheckboxClick = () => setIsChecked(prev => !prev);
    const getContent = () => {
        const noBackupHeading = (
            <Translation id="TR_DEVICE_LABEL_IS_NOT_BACKED_UP" values={{ deviceLabel }} />
        );

        if (deviceWillBeWiped) {
            return {
                heading: isBackedUp ? (
                    <Translation id="TR_CONTINUE_ONLY_WITH_SEED" />
                ) : (
                    noBackupHeading
                ),
                description: (
                    <Column gap={spacings.md}>
                        <Translation
                            id={
                                isBackedUp
                                    ? 'TR_CONTINUE_ONLY_WITH_SEED_DESCRIPTION'
                                    : 'TR_SWITCH_FIRMWARE_NO_BACKUP'
                            }
                        />
                        <Translation
                            id={
                                isBackedUp
                                    ? 'TR_CONTINUE_ONLY_WITH_SEED_DESCRIPTION_2'
                                    : 'TR_SWITCH_FIRMWARE_NO_BACKUP_2'
                            }
                        />
                    </Column>
                ),
                checkbox: <Translation id="TR_READ_AND_UNDERSTOOD" />,
            };
        }

        return isBackedUp
            ? {
                  heading: <Translation id="TR_SECURITY_CHECKPOINT_GOT_SEED" />,
                  description: <Translation id="TR_BEFORE_ANY_FURTHER_ACTIONS" />,
                  checkbox: <Translation id="FIRMWARE_USER_HAS_SEED_CHECKBOX_DESC" />,
              }
            : {
                  heading: noBackupHeading,
                  description: <Translation id="TR_FIRMWARE_IS_POTENTIALLY_RISKY" />,
                  checkbox: <Translation id="FIRMWARE_USER_TAKES_RESPONSIBILITY_CHECKBOX_DESC" />,
              };
    };

    const { heading, description, checkbox } = getContent();

    return (
        <OnboardingStepBox
            image="FIRMWARE"
            heading={heading}
            description={description}
            innerActions={
                <FirmwareButtonsRow withCancelButton={deviceWillBeWiped} onClose={onClose}>
                    <Button
                        onClick={onSuccess}
                        data-testid="@firmware/confirm-seed-button"
                        isDisabled={!device?.connected || !isChecked}
                    >
                        <Translation
                            id={deviceWillBeWiped ? 'TR_WIPE_AND_REINSTALL' : 'TR_CONTINUE'}
                        />
                    </Button>
                    <FirmwareInstallationBackupButton isBackedUp={isBackedUp} />
                </FirmwareButtonsRow>
            }
            disableConfirmWrapper
            nested
        >
            {deviceWillBeWiped && (
                <StyledSwitchWarning>
                    <Translation id="TR_FIRMWARE_SWITCH_WARNING_3" />
                </StyledSwitchWarning>
            )}
            <Checkbox
                isChecked={isChecked}
                onClick={handleCheckboxClick}
                margin={{ top: spacings.md }}
                data-testid="@firmware/confirm-seed-checkbox"
            >
                {checkbox}
            </Checkbox>
        </OnboardingStepBox>
    );
};
