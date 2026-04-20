import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { Translation } from '@suite/intl';
import { selectIsDeviceOrUiLocked } from '@suite/locks';
import { selectSelectedDevice } from '@suite-common/device';
import { type TrezorDevice } from '@suite-common/suite-types';
import { startThpAutoconnectThunk, thpActions } from '@suite-common/thp';
import { Card, Modal, Paragraph } from '@trezor/components';

type ThpAutoconnectInfoModalParams = {
    device: TrezorDevice;
};

export const ThpAutoconnectInfoModal = ({ device }: ThpAutoconnectInfoModalParams) => {
    const [isLoading, setIsLoading] = useState(false);

    const dispatch = useDispatch();
    const isDeviceOrUiLocked = useSelector(selectIsDeviceOrUiLocked);
    const selectedDevice = useSelector(selectSelectedDevice);

    const onTurnOn = () => {
        setIsLoading(true);
        dispatch(startThpAutoconnectThunk({ device }));
    };

    const onCancel = () => {
        dispatch(thpActions.finishAutoconnectFlow());
    };

    // Do not use selected device directly. It may be different from the THP device
    // we are handling this for.
    const isSelectedDeviceAndLocked = selectedDevice?.id === device.id && isDeviceOrUiLocked;

    return (
        <Modal
            data-testid="@modal/thp-autoconnect-info"
            heading={<Translation id="TR_THP_AUTO_CONNECT_INFO_MODAL_HEADER" />}
            bottomContent={
                <>
                    <Modal.Button
                        onClick={onTurnOn}
                        isLoading={isLoading || isSelectedDeviceAndLocked}
                    >
                        <Translation id="TR_THP_TURN_ON_AUTO_CONNECT" />
                    </Modal.Button>
                    <Modal.Button
                        onClick={onCancel}
                        intent="neutral"
                        priority="secondary"
                        isDisabled={isLoading}
                    >
                        <Translation id="TR_THP_TURN_ON_AUTO_CONNECT_NO_THANKS" />
                    </Modal.Button>
                </>
            }
            onCancel={onCancel}
        >
            <Card>
                <Paragraph>
                    <Translation id="TR_THP_AUTO_CONNECT_INFO_MODAL_DESCRIPTION" />
                </Paragraph>
            </Card>
        </Modal>
    );
};
