import styled from 'styled-components';

import { Button, Checkbox, variables } from '@trezor/components';
import { useDevice, useDispatch, useFirmware } from 'src/hooks/suite';
import { Translation } from 'src/components/suite';
import { OnboardingStepBox } from 'src/components/onboarding';
import { FirmwareButtonsRow } from './Buttons/FirmwareButtonsRow';
import { FirmwareSwitchWarning } from './FirmwareSwitchWarning';
import { goto } from 'src/actions/suite/routerActions';
import { SettingsAnchor } from 'src/constants/suite/anchors';

const StyledCheckbox = styled(Checkbox)`
    margin: 16px 0;
`;

const DescriptionWrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: 16px;
`;

const TextButton = styled.span`
    cursor: pointer;
    text-decoration: underline;
`;

const StyledSwitchWarning = styled(FirmwareSwitchWarning)`
    align-self: flex-start;
    border-bottom: 1px solid ${({ theme }) => theme.STROKE_GREY};
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    margin-bottom: 8px;
    padding-bottom: 16px;
    text-transform: uppercase;
`;

type CheckSeedStepProps = {
    onClose?: () => void;
    onSuccess: () => void;
    willBeWiped?: boolean;
};

export const CheckSeedStep = ({ onClose, onSuccess, willBeWiped }: CheckSeedStepProps) => {
    const dispatch = useDispatch();
    const { device } = useDevice();
    const { hasSeed, toggleHasSeed } = useFirmware();

    // unacquired device handled on higher level

    if (!device?.features) return null;

    const isBackedUp = !device.features.needs_backup && !device.features.unfinished_backup;

    const getContent = () => {
        const noBackupHeading = (
            <Translation
                id="TR_DEVICE_LABEL_IS_NOT_BACKED_UP"
                values={{ deviceLabel: device.label }}
            />
        );

        if (willBeWiped) {
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
                <FirmwareButtonsRow withCancelButton={willBeWiped} onClose={onClose}>
                    <Button
                        onClick={onSuccess}
                        data-test="@firmware/confirm-seed-button"
                        isDisabled={!device?.connected || !hasSeed}
                    >
                        <Translation id={willBeWiped ? 'TR_WIPE_AND_REINSTALL' : 'TR_CONTINUE'} />
                    </Button>
                </FirmwareButtonsRow>
            }
            disableConfirmWrapper
            nested
        >
            {willBeWiped && (
                <StyledSwitchWarning>
                    <Translation id="TR_FIRMWARE_SWITCH_WARNING_3" />
                </StyledSwitchWarning>
            )}
            <StyledCheckbox
                isChecked={hasSeed}
                onClick={toggleHasSeed}
                data-test="@firmware/confirm-seed-checkbox"
            >
                {checkbox}
            </StyledCheckbox>
        </OnboardingStepBox>
    );
};
