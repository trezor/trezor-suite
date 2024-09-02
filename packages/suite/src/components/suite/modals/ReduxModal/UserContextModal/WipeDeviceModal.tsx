import { useState } from 'react';
import { NewModal, Card, Column, H3, Paragraph } from '@trezor/components';
import { Translation, CheckItem } from 'src/components/suite';
import { wipeDevice } from 'src/actions/settings/deviceSettingsActions';
import { useDevice, useDispatch } from 'src/hooks/suite';
import { spacings } from '@trezor/theme';

type WipeDeviceModalProps = {
    onCancel: () => void;
};

export const WipeDeviceModal = ({ onCancel }: WipeDeviceModalProps) => {
    const [checkbox1, setCheckbox1] = useState(false);
    const [checkbox2, setCheckbox2] = useState(false);

    const dispatch = useDispatch();

    const { isLocked } = useDevice();

    const handleWipeDevice = () => dispatch(wipeDevice());

    return (
        <NewModal
            onCancel={onCancel}
            variant="destructive"
            icon="shieldWarning"
            size="small"
            bottomContent={
                <>
                    <NewModal.Button
                        variant="destructive"
                        onClick={handleWipeDevice}
                        isDisabled={isLocked() || !checkbox1 || !checkbox2}
                        data-testid="@wipe/wipe-button"
                    >
                        <Translation id="TR_DEVICE_SETTINGS_BUTTON_WIPE_DEVICE" />
                    </NewModal.Button>
                    <NewModal.Button variant="tertiary" onClick={onCancel}>
                        <Translation id="TR_CANCEL" />
                    </NewModal.Button>
                </>
            }
        >
            <H3>
                <Translation id="TR_DEVICE_SETTINGS_BUTTON_WIPE_DEVICE" />
            </H3>
            <Paragraph variant="tertiary" margin={{ top: spacings.xs }}>
                <Translation id="TR_WIPE_DEVICE_TEXT" />
            </Paragraph>
            <Card margin={{ top: spacings.lg }}>
                <Column gap={spacings.xs}>
                    <CheckItem
                        title={<Translation id="TR_WIPE_DEVICE_CHECKBOX_1_TITLE" />}
                        description={<Translation id="TR_WIPE_DEVICE_CHECKBOX_1_DESCRIPTION" />}
                        isChecked={checkbox1}
                        onClick={() => setCheckbox1(!checkbox1)}
                        data-testid="@wipe/checkbox-1"
                    />
                    <CheckItem
                        title={<Translation id="TR_WIPE_DEVICE_CHECKBOX_2_TITLE" />}
                        description={<Translation id="TR_WIPE_DEVICE_CHECKBOX_2_DESCRIPTION" />}
                        isChecked={checkbox2}
                        onClick={() => setCheckbox2(!checkbox2)}
                        data-testid="@wipe/checkbox-2"
                    />
                </Column>
            </Card>
        </NewModal>
    );
};
