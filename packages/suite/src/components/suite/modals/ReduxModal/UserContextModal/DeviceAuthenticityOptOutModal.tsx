import { useState } from 'react';

import { Translation } from '@suite/intl';
import { Banner, Card, Column, H3, Modal, Paragraph } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { toggleDeviceAuthenticityCheck } from 'src/actions/suite/suiteActions';
import { CheckItem } from 'src/components/suite/CheckItem';
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
            width={600}
            bottomContent={
                <>
                    <Modal.Button
                        onClick={handleTurningOffRevisionCheck}
                        isDisabled={!isConfirmed}
                        data-testid="@device-authenticity/opt-out-button"
                    >
                        <Translation id="TR_DEVICE_AUTHENTICITY_OPT_OUT_MODAL_BUTTON" />
                    </Modal.Button>
                    <Modal.Button intent="neutral" priority="secondary" onClick={onCancel}>
                        <Translation id="TR_CANCEL" />
                    </Modal.Button>
                </>
            }
            intent="warning"
        >
            <H3>
                <Translation id="TR_DEVICE_AUTHENTICITY_OPT_OUT_TITLE" />
            </H3>
            <Paragraph intent="neutral" priority="secondary" typographyStyle="body-sm">
                <Translation id="TR_DEVICE_AUTHENTICITY_OPT_OUT_MODAL_DESCRIPTION_3" />
            </Paragraph>
            <Column gap={spacings.sm} margin={{ top: spacings.xl }} alignItems="center">
                <Banner
                    icon="questionFilled"
                    description={
                        <Translation id="TR_DEVICE_AUTHENTICITY_OPT_OUT_MODAL_DESCRIPTION_1" />
                    }
                />
                <Banner
                    icon="warningFilled"
                    description={
                        <Translation id="TR_DEVICE_AUTHENTICITY_OPT_OUT_MODAL_DESCRIPTION_2" />
                    }
                />
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
