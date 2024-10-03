import { useState } from 'react';
import styled from 'styled-components';

import { Button, Checkbox, variables } from '@trezor/components';
import { spacingsPx } from '@trezor/theme';
import { selectDeviceLabelOrName } from '@suite-common/wallet-core';
import { useDevice, useDispatch, useFirmware, useSelector } from 'src/hooks/suite';
import { Translation } from 'src/components/suite';
import { OnboardingStepBox } from 'src/components/onboarding';
import { FirmwareButtonsRow } from './Buttons/FirmwareButtonsRow';
import { FirmwareSwitchWarning } from './FirmwareSwitchWarning';
import { goto } from 'src/actions/suite/routerActions';
import { SettingsAnchor } from 'src/constants/suite/anchors';

// eslint-disable-next-line local-rules/no-override-ds-component
const StyledCheckbox = styled(Checkbox)`
    margin: ${spacingsPx.md} 0;
`;

const DescriptionWrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${spacingsPx.md};
`;

const TextButton = styled.span`
    cursor: pointer;
    text-decoration: underline;
`;

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
    onClose?: () => void;
    onSuccess: () => void;
};

export const CheckSeedStep = ({ onClose, onSuccess }: CheckSeedStepProps) => {
    const deviceLabel = useSelector(selectDeviceLabelOrName);
    const dispatch = useDispatch();
    const { device } = useDevice();
    const { deviceWillBeWiped } = useFirmware();
    const [isChecked, setIsChecked] = useState(false);

    const handleCheckboxClick = () => setIsChecked(prev => !prev);
    const getContent = () => {
        const isBackedUp =
            device?.features?.backup_availability !== 'Required' &&
            !device?.features?.unfinished_backup;

        const noBackupHeading = (
            <Translation id="TR_DEVICE_LABEL_IS_NOT_BACKED_UP" values={{ deviceLabel }} />
        );

        if (deviceWillBeWiped) {
            const goToDeviceSettingsAnchor = (anchor: SettingsAnchor) =>
                dispatch(goto('settings-device', { anchor }));
            const goToCreateBackup = () =>
                goToDeviceSettingsAnchor(SettingsAnchor.BackupRecoverySeed);
            const goToCheckBackup = () =>
                goToDeviceSettingsAnchor(SettingsAnchor.CheckRecoverySeed);

            return {
                heading: isBackedUp ? (
                    <Translation id="TR_CONTINUE_ONLY_WITH_SEED" />
                ) : (
                    noBackupHeading
                ),
                description: (
                    <DescriptionWrapper>
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
                            values={{
                                button: chunks => (
                                    <TextButton
                                        onClick={isBackedUp ? goToCheckBackup : goToCreateBackup}
                                    >
                                        {chunks}
                                    </TextButton>
                                ),
                            }}
                        />
                    </DescriptionWrapper>
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
            <StyledCheckbox
                isChecked={isChecked}
                onClick={handleCheckboxClick}
                data-testid="@firmware/confirm-seed-checkbox"
            >
                {checkbox}
            </StyledCheckbox>
        </OnboardingStepBox>
    );
};
