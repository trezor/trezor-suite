import { useState } from 'react';

import { Column, NewModal, Banner, Card, H3, Paragraph } from '@trezor/components';
import { Translation, CheckItem } from 'src/components/suite';
import { checkFirmwareHash } from 'src/actions/suite/suiteActions';
import { useDispatch } from 'src/hooks/suite';
import { spacings } from '@trezor/theme';

type DeviceAuthenticityOptOutModalProps = {
    onCancel: () => void;
};

export const FirmwareHashOptOutModal = ({ onCancel }: DeviceAuthenticityOptOutModalProps) => {
    const [isConfirmed, setIsConfirmed] = useState(false);
    const dispatch = useDispatch();

    const handleTurningOffHashCheck = () => {
        dispatch(checkFirmwareHash({ isDisabled: true }));
        onCancel();
    };

    return (
        <NewModal
            onCancel={onCancel}
            iconName="shieldWarning"
            size="small"
            bottomContent={
                <>
                    <NewModal.Button
                        onClick={handleTurningOffHashCheck}
                        isDisabled={!isConfirmed}
                        data-testid="@device-firmware-hash/opt-out-button"
                    >
                        <Translation id="TR_DEVICE_FIRMWARE_REVISION_CHECK_MODAL_BUTTON" />
                    </NewModal.Button>
                    <NewModal.Button variant="tertiary" onClick={onCancel}>
                        <Translation id="TR_CANCEL" />
                    </NewModal.Button>
                </>
            }
            variant="warning"
        >
            <H3>
                <Translation id="TR_DEVICE_FIRMWARE_REVISION_CHECK_TITLE" />
                {/* TODO #14766 REMOVE ME ! */}
                (HASH)
            </H3>
            <Paragraph variant="tertiary" typographyStyle="hint">
                <Translation id="TR_DEVICE_FIRMWARE_REVISION_CHECK_MODAL_DESCRIPTION_3" />
            </Paragraph>
            <Column gap={spacings.sm} margin={{ top: spacings.xl }}>
                <Banner icon="questionFilled">
                    <Translation id="TR_DEVICE_FIRMWARE_REVISION_CHECK_MODAL_DESCRIPTION_1" />
                </Banner>
                <Banner icon="warningFilled">
                    <Translation id="TR_DEVICE_FIRMWARE_REVISION_CHECK_MODAL_DESCRIPTION_2" />
                </Banner>
            </Column>
            <Card margin={{ top: spacings.lg }}>
                <CheckItem
                    title={<Translation id="TR_DEVICE_AUTHENTICITY_OPT_OUT_MODAL_CHECKBOX_TITLE" />}
                    isChecked={isConfirmed}
                    onClick={() => setIsConfirmed(!isConfirmed)}
                    data-testid="@device-firmware-hash/checkbox"
                />
            </Card>
        </NewModal>
    );
};
