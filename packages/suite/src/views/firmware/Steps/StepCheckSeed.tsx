import { ReactNode } from 'react';

import { Translation } from '@suite/intl';
import { goto } from '@suite/router';
import {
    selectIsDeviceBackedUp,
    selectSelectedDevice,
    selectSelectedDeviceLabelOrName,
} from '@suite-common/device';
import { Banner, Card, Checkbox, Column, H4, Modal, Paragraph } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { PrerequisitesGuide } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';

type StepCheckSeedProps = {
    deviceWillBeWiped: boolean;
    setIsChecked: (isChecked: boolean) => void;
    isChecked: boolean;
    onClose: () => void;
    resetReducer: () => void;
    install: () => void;
    modalHeading: ReactNode;
};

export const StepCheckSeed = ({
    deviceWillBeWiped,
    setIsChecked,
    isChecked,
    onClose,
    resetReducer,
    install,
    modalHeading,
}: StepCheckSeedProps) => {
    const device = useSelector(selectSelectedDevice);
    const deviceLabel = useSelector(selectSelectedDeviceLabelOrName);
    const isDeviceBackedUp = useSelector(selectIsDeviceBackedUp);

    const dispatch = useDispatch();

    if (!device?.connected || !device?.features) {
        return <PrerequisitesGuide />;
    }

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
                        <Paragraph intent="neutral" priority="secondary">
                            <Translation
                                id={
                                    isDeviceBackedUp
                                        ? 'TR_CONTINUE_ONLY_WITH_SEED_DESCRIPTION'
                                        : 'TR_SWITCH_FIRMWARE_NO_BACKUP'
                                }
                            />
                        </Paragraph>
                        <Paragraph intent="neutral" priority="secondary">
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
                      <Paragraph intent="neutral" priority="secondary">
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
                      <Paragraph intent="neutral" priority="secondary">
                          <Translation id="TR_FIRMWARE_IS_POTENTIALLY_RISKY" />
                      </Paragraph>
                  ),
                  checkbox: <Translation id="FIRMWARE_USER_TAKES_RESPONSIBILITY_CHECKBOX_DESC" />,
              };
    };

    const { heading, description, checkbox } = getContent();

    return (
        <Modal.ModalBase
            onCancel={onClose}
            data-testid="@firmware-modal"
            heading={modalHeading}
            bottomContent={
                <>
                    <Modal.Button
                        onClick={install}
                        data-testid="@firmware/confirm-seed-button"
                        isDisabled={!device?.connected || !isChecked}
                        intent={deviceWillBeWiped ? 'critical' : 'brand'}
                    >
                        <Translation
                            id={deviceWillBeWiped ? 'TR_WIPE_AND_REINSTALL' : 'TR_INSTALL'}
                        />
                    </Modal.Button>
                    <Modal.Button
                        intent="neutral"
                        priority="secondary"
                        onClick={() => {
                            resetReducer();
                            dispatch(
                                goto({
                                    routeName: isDeviceBackedUp ? 'recovery-index' : 'backup-index',
                                }),
                            );
                        }}
                    >
                        <Translation id={isDeviceBackedUp ? 'TR_CHECK_SEED' : 'TR_CREATE_BACKUP'} />
                    </Modal.Button>
                </>
            }
        >
            <Column gap={spacings.md}>
                <Column gap={spacings.xs} margin={{ bottom: spacings.xs }}>
                    <H4>{heading}</H4>
                    {description}
                </Column>
                {deviceWillBeWiped && (
                    <Banner
                        intent="critical"
                        icon="warning"
                        description={<Translation id="TR_FIRMWARE_SWITCH_WARNING_3" />}
                    />
                )}
                <Card>
                    <Checkbox
                        isChecked={isChecked}
                        onChange={() => setIsChecked(!isChecked)}
                        data-testid="@firmware/confirm-seed-checkbox"
                    >
                        {checkbox}
                    </Checkbox>
                </Card>
            </Column>
        </Modal.ModalBase>
    );
};
