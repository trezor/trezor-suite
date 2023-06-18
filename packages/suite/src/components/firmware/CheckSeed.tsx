import React from 'react';
import styled from 'styled-components';
import { Button, Checkbox } from '@trezor/components';
import { useDevice, useFirmware } from 'src/hooks/suite';
import { Translation } from 'src/components/suite';
import { OnboardingStepBox } from 'src/components/onboarding';
import { P } from 'src/components/firmware';

const StyledCheckbox = styled(Checkbox)`
    margin: 16px 0;
`;

type CheckSeedStepProps = {
    onSuccess: () => void;
};

export const CheckSeedStep = ({ onSuccess }: CheckSeedStepProps) => {
    const { device } = useDevice();
    const { toggleHasSeed, hasSeed } = useFirmware();

    // unacquired device handled on higher level
    if (!device?.features) return null;

    // device is not backed up - it is not advisable to do firmware update
    // expected flow - device is backed up
    const isBackedUp = !device.features.needs_backup && !device.features.unfinished_backup;
    const { heading, description, checkbox } = !isBackedUp
        ? {
              heading: (
                  <Translation
                      id="TR_DEVICE_LABEL_IS_NOT_BACKED_UP"
                      values={{ deviceLabel: device.label }}
                  />
              ),
              description: <Translation id="TR_FIRMWARE_IS_POTENTIALLY_RISKY" />,
              checkbox: <Translation id="FIRMWARE_USER_TAKES_RESPONSIBILITY_CHECKBOX_DESC" />,
          }
        : {
              heading: <Translation id="TR_SECURITY_CHECKPOINT_GOT_SEED" />,
              description: <Translation id="TR_BEFORE_ANY_FURTHER_ACTIONS" />,
              checkbox: <Translation id="FIRMWARE_USER_HAS_SEED_CHECKBOX_DESC" />,
          };

    return (
        <OnboardingStepBox
            image="FIRMWARE"
            heading={heading}
            description={description}
            innerActions={
                <Button
                    onClick={onSuccess}
                    data-test="@firmware/confirm-seed-button"
                    isDisabled={!device?.connected || !hasSeed}
                >
                    <Translation id="TR_CONTINUE" />
                </Button>
            }
            disableConfirmWrapper
            nested
        >
            <StyledCheckbox
                isChecked={hasSeed}
                onClick={toggleHasSeed}
                data-test="@firmware/confirm-seed-checkbox"
            >
                <P>{checkbox}</P>
            </StyledCheckbox>
        </OnboardingStepBox>
    );
};
