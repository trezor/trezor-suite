import { useState } from 'react';

import { Banner, Card, Column, H3, Modal, Paragraph } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { toggleDeviceAuthenticityCheck } from 'src/actions/suite/suiteActions';
import { CheckItem, Translation } from 'src/components/suite';
import { useDispatch } from 'src/hooks/suite';

type DeviceAuthenticityOptOutModalProps = {
    onCancel: () => void;
};

export const DeviceAuthenticityOptOutModal = ({ onCancel }: DeviceAuthenticityOptOutModalProps) => {
    const [isConfirmed, setIsConfirmed] = useState(false);
    const dispatch = useDispatch();

    const handleTurningOffRevisionCheck = () => {
        dispatch(toggleDeviceAuthenticityCheck(false));
        onCancel();
    };

    return (
        <Modal
            onCancel={onCancel}
            iconName="shieldWarning"
            size="small"
            bottomContent={
                <>
                    <Modal.Button
                        onClick={handleTurningOffRevisionCheck}
                        isDisabled={!isConfirmed}
                        data-testid="@device-authenticity/opt-out-button"
                    >
                        <Translation id="TR_DEVICE_AUTHENTICITY_OPT_OUT_MODAL_BUTTON" />
                    </Modal.Button>
                    <Modal.Button variant="tertiary" onClick={onCancel}>
                        <Translation id="TR_CANCEL" />
                    </Modal.Button>
                </>
            }
            variant="warning"
        >
            <H3>
                <Translation id="TR_DEVICE_AUTHENTICITY_OPT_OUT_TITLE" />
            </H3>
            <Paragraph variant="tertiary" typographyStyle="hint">
                <Translation id="TR_DEVICE_AUTHENTICITY_OPT_OUT_MODAL_DESCRIPTION_3" />
            </Paragraph>
            <Column gap={spacings.sm} margin={{ top: spacings.xl }} alignItems="center">
                <Banner icon="questionFilled">
                    <Translation id="TR_DEVICE_AUTHENTICITY_OPT_OUT_MODAL_DESCRIPTION_1" />
                </Banner>
                <Banner icon="warningFilled">
                    <Translation id="TR_DEVICE_AUTHENTICITY_OPT_OUT_MODAL_DESCRIPTION_2" />
                </Banner>
            </Column>
            <Card margin={{ top: spacings.lg }}>
                <CheckItem
                    title={<Translation id="TR_DEVICE_AUTHENTICITY_OPT_OUT_MODAL_CHECKBOX_TITLE" />}
                    isChecked={isConfirmed}
                    onClick={() => setIsConfirmed(!isConfirmed)}
                    data-testid="@device-authenticity/checkbox"
                />
            </Card>
        </Modal>
    );
};
