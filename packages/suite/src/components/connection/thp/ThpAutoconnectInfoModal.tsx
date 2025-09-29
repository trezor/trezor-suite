import { useState } from 'react';

import { TrezorDevice } from '@suite-common/suite-types';
import { finishThpAutoconnectThunk, startThpAutoconnectThunk } from '@suite-common/thp';
import { Column, H3, Modal, Paragraph } from '@trezor/components';

import { useDispatch } from '../../../hooks/suite';
import { Translation } from '../../suite/Translation';

type ThpAutoconnectInfoModalParams = {
    device: TrezorDevice;
};

export const ThpAutoconnectInfoModal = ({ device }: ThpAutoconnectInfoModalParams) => {
    const [isLoading, setIsLoading] = useState(false);
    const dispatch = useDispatch();

    const onTurnOn = () => {
        setIsLoading(true);
        dispatch(startThpAutoconnectThunk({ device }));
    };

    const onCancel = () => {
        dispatch(finishThpAutoconnectThunk());
    };

    return (
        <Modal
            data-testid="@modal/thp-autoconnect-info"
            bottomContent={
                <>
                    <Modal.Button onClick={onTurnOn} isLoading={isLoading}>
                        <Translation id="TR_THP_TURN_ON_AUTO_CONNECT" />
                    </Modal.Button>
                    <Modal.Button onClick={onCancel} variant="tertiary" isDisabled={isLoading}>
                        <Translation id="TR_THP_TURN_ON_AUTO_CONNECT_NO_THANKS" />
                    </Modal.Button>
                </>
            }
            onCancel={onCancel}
            size="small"
            variant="info"
            iconName="bluetooth"
        >
            <Column gap={4}>
                <H3>
                    <Translation id="TR_THP_AUTO_CONNECT_INFO_MODAL_HEADER" />
                </H3>
                <Paragraph variant="tertiary">
                    <Translation id="TR_THP_AUTO_CONNECT_INFO_MODAL_DESCRIPTION" />
                </Paragraph>
            </Column>
        </Modal>
    );
};
