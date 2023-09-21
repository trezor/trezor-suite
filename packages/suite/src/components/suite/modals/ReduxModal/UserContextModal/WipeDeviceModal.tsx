import { useState } from 'react';
import styled from 'styled-components';
import { Button, Image } from '@trezor/components';
import { Translation, CheckItem, Modal } from 'src/components/suite';
import { wipeDevice } from 'src/actions/settings/deviceSettingsActions';
import { useDevice, useDispatch } from 'src/hooks/suite';

const Row = styled.div`
    display: flex;
    flex-direction: row;
`;

const Col = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
`;

const CheckItems = styled(Row)`
    justify-content: center;
    margin-top: 16px;
    margin-bottom: 16px;
`;

const StyledModal = styled(Modal)`
    width: 600px;
    ${Modal.Content} {
        justify-content: center;
        align-items: center;
    }
`;

const WarningImage = styled(Image)`
    margin: 24px 0;
`;

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
        <StyledModal
            isCancelable
            onCancel={onCancel}
            heading={<Translation id="TR_WIPE_DEVICE_HEADING" />}
            description={<Translation id="TR_WIPE_DEVICE_TEXT" />}
            bottomBarComponents={
                <Button
                    variant="destructive"
                    onClick={handleWipeDevice}
                    isDisabled={isLocked() || !checkbox1 || !checkbox2}
                    data-test="@wipe/wipe-button"
                >
                    <Translation id="TR_DEVICE_SETTINGS_BUTTON_WIPE_DEVICE" />
                </Button>
            }
        >
            <WarningImage image="UNI_ERROR" />

            <CheckItems>
                <Col>
                    <CheckItem
                        title={<Translation id="TR_WIPE_DEVICE_CHECKBOX_1_TITLE" />}
                        description={<Translation id="TR_WIPE_DEVICE_CHECKBOX_1_DESCRIPTION" />}
                        isChecked={checkbox1}
                        onClick={() => setCheckbox1(!checkbox1)}
                        data-test="@wipe/checkbox-1"
                    />
                    <CheckItem
                        title={<Translation id="TR_WIPE_DEVICE_CHECKBOX_2_TITLE" />}
                        description={<Translation id="TR_WIPE_DEVICE_CHECKBOX_2_DESCRIPTION" />}
                        isChecked={checkbox2}
                        onClick={() => setCheckbox2(!checkbox2)}
                        data-test="@wipe/checkbox-2"
                    />
                </Col>
            </CheckItems>
        </StyledModal>
    );
};
