import React from 'react';
import styled from 'styled-components';
import { Button } from '@trezor/components';
import { Translation, Image, Modal } from '@suite-components';
import * as suiteActions from '@suite-actions/suiteActions';
import { useDevice, useActions } from '@suite-hooks';
import { TrezorDevice } from '@suite-types';

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

const StyledImage = styled(Image)`
    margin: 24px 0px;
`;

const StyledModal = styled(Modal)`
    width: 360px;
    ${Modal.Content} {
        justify-content: center;
        align-items: center;
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
        <StyledModal
            heading={<Translation id="TR_WALLET_DUPLICATE_TITLE" />}
            description={<Translation id="TR_WALLET_DUPLICATE_DESC" />}
            data-test="@passphrase-duplicate"
            bottomBar={
                <Actions>
                    <Button
                        variant="primary"
                        onClick={() => switchDuplicatedDevice(device, duplicate)}
                        isDisabled={isDeviceLocked}
                        fullWidth
                    >
                        <Translation id="TR_WALLET_DUPLICATE_SWITCH" />
                    </Button>
                    <Button
                        variant="secondary"
                        onClick={authorizeDevice}
                        isDisabled={isDeviceLocked}
                        fullWidth
                    >
                        <Translation id="TR_WALLET_DUPLICATE_RETRY" />
                    </Button>
                </Actions>
            }
        >
            <StyledImage image="UNI_WARNING" width="160" />
        </StyledModal>
    );
};

export default PassphraseDuplicate;
