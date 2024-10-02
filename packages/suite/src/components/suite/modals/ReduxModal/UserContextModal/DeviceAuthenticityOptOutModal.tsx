import { useState } from 'react';

import { Column, NewModal, Card, Banner, H3, Paragraph } from '@trezor/components';
import { Translation, CheckItem } from 'src/components/suite';
import { deviceAuthenticityOptOut } from 'src/actions/suite/suiteActions';
import { useDispatch } from 'src/hooks/suite';
import { spacings } from '@trezor/theme';

type DeviceAuthenticityOptOutModalProps = {
    onCancel: () => void;
};

export const DeviceAuthenticityOptOutModal = ({ onCancel }: DeviceAuthenticityOptOutModalProps) => {
    const [isConfirmed, setIsConfirmed] = useState(false);
    const dispatch = useDispatch();

    const handleTurningOffRevisionCheck = () => {
        dispatch(deviceAuthenticityOptOut(true));
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
                        onClick={handleTurningOffRevisionCheck}
                        isDisabled={!isConfirmed}
                        data-testid="@device-authenticity/opt-out-button"
                    >
                        <Translation id="TR_DEVICE_AUTHENTICITY_OPT_OUT_MODAL_BUTTON" />
                    </NewModal.Button>
                    <NewModal.Button variant="tertiary" onClick={onCancel}>
                        <Translation id="TR_CANCEL" />
                    </NewModal.Button>
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
            <Column gap={spacings.sm} margin={{ top: spacings.xl }}>
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
        </NewModal>
    );
};
