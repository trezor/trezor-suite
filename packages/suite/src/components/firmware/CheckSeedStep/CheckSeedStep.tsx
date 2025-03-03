import { selectIsDeviceBackedUp, selectSelectedDeviceLabelOrName } from '@suite-common/wallet-core';
import { Banner, Card, Checkbox, Column, H4, Paragraph } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { Translation } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';

type CheckSeedStepProps = {
    deviceWillBeWiped: boolean;
    setIsChecked: (isChecked: boolean) => void;
    isChecked: boolean;
};

export const CheckSeedStep = ({
    deviceWillBeWiped,
    setIsChecked,
    isChecked,
}: CheckSeedStepProps) => {
    const deviceLabel = useSelector(selectSelectedDeviceLabelOrName);
    const isDeviceBackedUp = useSelector(selectIsDeviceBackedUp);

    const getContent = () => {
        if (deviceWillBeWiped) {
            return {
                heading: isDeviceBackedUp ? (
                    <Translation id="TR_CONTINUE_ONLY_WITH_SEED" />
                ) : (
                    <Translation id="TR_DEVICE_LABEL_IS_NOT_BACKED_UP" values={{ deviceLabel }} />
                ),
                description: (
                    <>
                        <Paragraph variant="tertiary">
                            <Translation
                                id={
                                    isDeviceBackedUp
                                        ? 'TR_CONTINUE_ONLY_WITH_SEED_DESCRIPTION'
                                        : 'TR_SWITCH_FIRMWARE_NO_BACKUP'
                                }
                            />
                        </Paragraph>
                        <Paragraph variant="tertiary">
                            <Translation
                                id={
                                    isDeviceBackedUp
                                        ? 'TR_CONTINUE_ONLY_WITH_SEED_DESCRIPTION_2'
                                        : 'TR_SWITCH_FIRMWARE_NO_BACKUP_2'
                                }
                            />
                        </Paragraph>
                    </>
                ),
                checkbox: <Translation id="TR_READ_AND_UNDERSTOOD" />,
            };
        }

        return isDeviceBackedUp
            ? {
                  heading: <Translation id="TR_SECURITY_CHECKPOINT_GOT_SEED" />,
                  description: (
                      <Paragraph variant="tertiary">
                          <Translation id="TR_BEFORE_ANY_FURTHER_ACTIONS" />
                      </Paragraph>
                  ),
                  checkbox: <Translation id="FIRMWARE_USER_HAS_SEED_CHECKBOX_DESC" />,
              }
            : {
                  heading: (
                      <Translation id="TR_DEVICE_LABEL_IS_NOT_BACKED_UP" values={{ deviceLabel }} />
                  ),
                  description: (
                      <Paragraph variant="tertiary">
                          <Translation id="TR_FIRMWARE_IS_POTENTIALLY_RISKY" />
                      </Paragraph>
                  ),
                  checkbox: <Translation id="FIRMWARE_USER_TAKES_RESPONSIBILITY_CHECKBOX_DESC" />,
              };
    };

    const { heading, description, checkbox } = getContent();

    return (
        <Column gap={spacings.md}>
            <Column gap={spacings.xs} margin={{ bottom: spacings.xs }}>
                <H4>{heading}</H4>
                {description}
            </Column>
            {deviceWillBeWiped && (
                <Banner variant="destructive" icon="warning">
                    <Translation id="TR_FIRMWARE_SWITCH_WARNING_3" />
                </Banner>
            )}
            <Card>
                <Checkbox
                    isChecked={isChecked}
                    onClick={() => setIsChecked(!isChecked)}
                    data-testid="@firmware/confirm-seed-checkbox"
                >
                    {checkbox}
                </Checkbox>
            </Card>
        </Column>
    );
};
