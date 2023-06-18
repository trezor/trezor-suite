import React from 'react';
import styled from 'styled-components';
import { Button, Image } from '@trezor/components';
import { Translation, Modal } from 'src/components/suite';
import * as suiteActions from 'src/actions/suite/suiteActions';
import { useDevice, useActions } from 'src/hooks/suite';
import { TrezorDevice } from 'src/types/suite';

type Props = {
    device: TrezorDevice;
    duplicate: TrezorDevice;
};

const StyledImage = styled(Image)`
    margin: 14px 0px;
`;

const StyledModal = styled(Modal)`
    width: 380px;
    ${Modal.Content} {
        justify-content: center;
        align-items: center;
    }
    ${Modal.BottomBar} {
        > * {
            flex: 1;
        }
    }
`;

export const PassphraseDuplicate = ({ device, duplicate }: Props) => {
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
                <>
                    <Button
                        variant="primary"
                        onClick={() => switchDuplicatedDevice(device, duplicate)}
                        isDisabled={isDeviceLocked}
                    >
                        <Translation id="TR_WALLET_DUPLICATE_SWITCH" />
                    </Button>
                    <Button
                        variant="secondary"
                        onClick={authorizeDevice}
                        isDisabled={isDeviceLocked}
                    >
                        <Translation id="TR_WALLET_DUPLICATE_RETRY" />
                    </Button>
                </>
            }
        >
            <StyledImage image="UNI_WARNING" width="160" />
        </StyledModal>
    );
};
