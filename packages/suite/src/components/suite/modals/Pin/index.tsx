import React from 'react';
import styled from 'styled-components';
import { Translation, Modal, ModalProps, PinMatrix } from '@suite-components';
import { TrezorDevice } from '@suite-types';

const StyledModal = styled(Modal)`
    width: unset;
`;

interface PinProps extends ModalProps {
    device: TrezorDevice;
}

const Pin = ({ device, ...rest }: PinProps) => {
    const pinRequestType = device.buttonRequests[device.buttonRequests.length - 1];
    const invalidCounter =
        device.buttonRequests.filter(r => r.code === 'ui-invalid_pin').length || 0;

    if (!device.features) return null;

    // 3 cases when we want to show left column
    // 1) and 2) - Setting a new pin: 1 entry, 2nd (confirmation) entry
    // 3) Invalid pin (It doesn't seem to work anymore) instead separate PinMismatch modal is shown
    const isExtended =
        (pinRequestType?.code &&
            ['PinMatrixRequestType_NewFirst', 'PinMatrixRequestType_NewSecond'].includes(
                pinRequestType.code,
            )) ||
        invalidCounter > 0;

    return (
        <StyledModal
            heading={<Translation id="TR_ENTER_PIN" />}
            description={<Translation id="TR_THE_PIN_LAYOUT_IS_DISPLAYED" />}
            {...rest}
            data-test="@modal/pin"
        >
            <PinMatrix device={device} hideExplanation={!isExtended} invalid={invalidCounter > 0} />
        </StyledModal>
    );
};

export default Pin;
