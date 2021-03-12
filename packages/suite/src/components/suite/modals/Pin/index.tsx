import React from 'react';
import { Translation, Modal, ModalProps, PinMatrix } from '@suite-components';
import { TrezorDevice } from '@suite-types';

interface OwnProps extends ModalProps {
    device: TrezorDevice;
    cancelable?: boolean;
    noBackground?: boolean;
    onCancel: () => void;
}

type Props = OwnProps;

const Pin = ({ device, cancelable, noBackground, noPadding, ...rest }: Props) => {
    const pinRequestType = device.buttonRequests[device.buttonRequests.length - 1];
    const invalidCounter = device.buttonRequests.filter(r => r === 'ui-invalid_pin').length || 0;

    if (!device.features) return null;

    // 3 cases when we want to show left column
    // 1) and 2) - Setting a new pin: 1 entry, 2nd (confirmation) entry
    // 3) Invalid pin (It doesn't seem to work anymore) instead separate PinMismatch modal is shown
    const isExtended =
        ['PinMatrixRequestType_NewFirst', 'PinMatrixRequestType_NewSecond'].includes(
            pinRequestType,
        ) || invalidCounter > 0;

    return (
        <Modal
            useFixedWidth={false}
            cancelable={cancelable}
            noBackground={noBackground}
            heading={<Translation id="TR_ENTER_PIN" />}
            description={<Translation id="TR_THE_PIN_LAYOUT_IS_DISPLAYED" />}
            noPadding={noPadding}
            // to squeeze pin matrix to Recovery modal flow we need to disable padding on heading element
            noHeadingPadding={noPadding}
            {...rest}
            data-test="@modal/pin"
        >
            <PinMatrix device={device} hideExplanation={!isExtended} invalid={invalidCounter > 0} />
        </Modal>
    );
};

export default Pin;
