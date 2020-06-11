import React from 'react';
import styled from 'styled-components';
import { Button, Modal } from '@trezor/components';
import DeviceConfirmImage from '@suite-components/images/DeviceConfirmImage';
import * as suiteActions from '@suite-actions/suiteActions';
import { useDevice, useActions } from '@suite-hooks';
import { TrezorDevice } from '@suite-types';
import { Translation } from '@suite-components';

type Props = {
    device: TrezorDevice;
    duplicate: TrezorDevice;
};

const Actions = styled.div`
    width: 100%;
    button + button {
        margin-top: 8px;
    }
`;

const PassphraseDuplicate = ({ device, duplicate }: Props) => {
    const { isLocked } = useDevice();
    const isDeviceLocked = isLocked();
    const { switchDuplicatedDevice, authorizeDevice } = useActions({
        switchDuplicatedDevice: suiteActions.switchDuplicatedDevice,
        authorizeDevice: suiteActions.authorizeDevice,
    });
    return (
        <Modal
            size="tiny"
            heading={<Translation id="TR_WALLET_DUPLICATE_TITLE" />}
            description={<Translation id="TR_WALLET_DUPLICATE_DESC" />}
            bottomBar={
                <Actions>
                    <Button
                        variant="primary"
                        onClick={() => switchDuplicatedDevice(device, duplicate)}
                        isLoading={isDeviceLocked}
                        fullWidth
                    >
                        <Translation id="TR_WALLET_DUPLICATE_SWITCH" />
                    </Button>
                    <Button
                        variant="secondary"
                        onClick={authorizeDevice}
                        isLoading={isDeviceLocked}
                        fullWidth
                    >
                        <Translation id="TR_WALLET_DUPLICATE_RETRY" />
                    </Button>
                </Actions>
            }
        >
            <DeviceConfirmImage device={device} />
        </Modal>
    );
};

export default PassphraseDuplicate;
