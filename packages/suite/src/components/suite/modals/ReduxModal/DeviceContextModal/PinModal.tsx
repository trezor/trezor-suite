import TrezorConnect from '@trezor/connect';
import styled from 'styled-components';

import { Modal, ModalProps, PinMatrix, Translation } from 'src/components/suite';
import { PIN_MATRIX_MAX_WIDTH } from 'src/components/suite/PinMatrix/PinMatrix';
import { usePin } from 'src/hooks/suite/usePinModal';
import { TrezorDevice } from 'src/types/suite';

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
    const { isRequestingNewPinCode, isWipeCode, isPinInvalid, isModalExtended } = usePin();

    if (!device.features) return null;

    const onCancel = () =>
        isWipeCode ? TrezorConnect.cancel('wipe-cancelled') : TrezorConnect.cancel('pin-cancelled');

    return (
        <StyledModal
            heading={<Translation id={isWipeCode ? 'TR_ENTER_WIPECODE' : 'TR_ENTER_PIN'} />}
            description={
                <Translation
                    id="TR_THE_PIN_LAYOUT_IS_DISPLAYED"
                    values={{ deviceLabel: device.label, b: text => <b>{text}</b> }}
                />
            }
            onCancel={onCancel}
            isCancelable
            data-test="@modal/pin"
            $isExtended={isModalExtended}
            {...rest}
        >
            <PinMatrix
                device={device}
                hideExplanation={!isRequestingNewPinCode}
                invalid={isPinInvalid}
            />
        </StyledModal>
    );
};
