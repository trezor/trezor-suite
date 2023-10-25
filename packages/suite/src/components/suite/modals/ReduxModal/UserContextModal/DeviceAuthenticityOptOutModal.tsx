import { useState } from 'react';
import styled from 'styled-components';
import { Button, Image, Paragraph } from '@trezor/components';
import { Translation, CheckItem, Modal } from 'src/components/suite';
import { deviceAutenticityOptOut } from 'src/actions/suite/suiteActions';
import { useDispatch } from 'src/hooks/suite';

const StyledParagraph = styled(Paragraph)`
    text-align: left;
    padding: 16px;
`;

const CheckboxWrapper = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: center;
    margin-top: 32px;
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

type DeviceAuthenticityOptOutModalProps = {
    onCancel: () => void;
};

export const DeviceAuthenticityOptOutModal = ({ onCancel }: DeviceAuthenticityOptOutModalProps) => {
    const [isConfirmed, setIsConfirmed] = useState(false);

    const dispatch = useDispatch();

    const handleDeviceAuthenticityOptOut = () => {
        dispatch(deviceAutenticityOptOut(true));
        onCancel();
    };

    return (
        <StyledModal
            isCancelable
            onCancel={onCancel}
            heading={<Translation id="TR_DEVICE_AUTHENTICITY_OPT_OUT_MODAL_HEADING" />}
            bottomBarComponents={
                <Button
                    variant="destructive"
                    onClick={handleDeviceAuthenticityOptOut}
                    isDisabled={!isConfirmed}
                    data-test="@device-authenticity/opt-out/button"
                >
                    <Translation id="TR_DEVICE_AUTHENTICITY_OPT_OUT_MODAL_BUTTON" />
                </Button>
            }
        >
            <WarningImage image="UNI_ERROR" />

            <StyledParagraph>
                <Translation id="TR_DEVICE_AUTHENTICITY_OPT_OUT_MODAL_DESCRIPTION_1" />
            </StyledParagraph>
            <StyledParagraph>
                <Translation id="TR_DEVICE_AUTHENTICITY_OPT_OUT_MODAL_DESCRIPTION_2" />
            </StyledParagraph>
            <StyledParagraph>
                <Translation id="TR_DEVICE_AUTHENTICITY_OPT_OUT_MODAL_DESCRIPTION_3" />
            </StyledParagraph>

            <CheckboxWrapper>
                <CheckItem
                    title={<Translation id="TR_DEVICE_AUTHENTICITY_OPT_OUT_MODAL_CHECKBOX_TITLE" />}
                    isChecked={isConfirmed}
                    onClick={() => setIsConfirmed(!isConfirmed)}
                    data-test="@device-authenticity/checkbox"
                />
            </CheckboxWrapper>
        </StyledModal>
    );
};
