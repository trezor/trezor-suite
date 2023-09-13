import styled from 'styled-components';
import { Translation, Modal, ModalProps } from 'src/components/suite';
import { PinMatrix, PIN_MATRIX_MAX_WIDTH } from 'src/components/suite/PinMatrix';
import { TrezorDevice } from 'src/types/suite';
import TrezorConnect from '@trezor/connect';

const StyledModal = styled(Modal)<{ $isExtended: boolean }>`
    width: unset;

    ${Modal.Description} {
        max-width: ${({ $isExtended }) =>
            $isExtended
                ? 'fit-content'
                : PIN_MATRIX_MAX_WIDTH}; /* limit width to prevent extending the modal past the width of the pin matrix */
    }
`;

interface PinModalProps extends ModalProps {
    device: TrezorDevice;
}

export const PinModal = ({ device, ...rest }: PinModalProps) => {
    const pinRequestType = device.buttonRequests[device.buttonRequests.length - 1];
    const invalidCounter =
        device.buttonRequests.filter(r => r.code === 'ui-invalid_pin').length || 0;

    if (!device.features) return null;

    const onCancel = () => TrezorConnect.cancel('pin-cancelled');

    // 3 cases when we want to show left column
    // 1) and 2) - Setting a new pin: 1 entry, 2nd (confirmation) entry
    // 3) Invalid pin (It doesn't seem to work anymore) instead separate PinMismatchModal is shown
    const isExtended =
        (pinRequestType?.code &&
            ['PinMatrixRequestType_NewFirst', 'PinMatrixRequestType_NewSecond'].includes(
                pinRequestType.code,
            )) ||
        invalidCounter > 0;

    return (
        <StyledModal
            heading={<Translation id="TR_ENTER_PIN" />}
            description={
                <Translation
                    id="TR_THE_PIN_LAYOUT_IS_DISPLAYED"
                    values={{ deviceLabel: device.label, b: text => <b>{text}</b> }}
                />
            }
            onCancel={onCancel}
            isCancelable
            data-test="@modal/pin"
            $isExtended={isExtended}
            {...rest}
        >
            <PinMatrix device={device} hideExplanation={!isExtended} invalid={invalidCounter > 0} />
        </StyledModal>
    );
};
