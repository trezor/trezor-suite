import styled from 'styled-components';

import { authorizeDevice, switchDuplicatedDevice } from '@suite-common/wallet-core';
import { Button, Image } from '@trezor/components';

import { Translation, Modal } from 'src/components/suite';
import { useDevice, useDispatch } from 'src/hooks/suite';
import { TrezorDevice } from 'src/types/suite';

const StyledImage = styled(Image)`
    margin: 14px 0;
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

type PassphraseDuplicateModalProps = {
    device: TrezorDevice;
    duplicate: TrezorDevice;
};

export const PassphraseDuplicateModal = ({ device, duplicate }: PassphraseDuplicateModalProps) => {
    const dispatch = useDispatch();
    const { isLocked } = useDevice();

    const isDeviceLocked = isLocked();

    const handleSwitchDevice = () => dispatch(switchDuplicatedDevice({ device, duplicate }));
    const handleAuthorizeDevice = () => dispatch(authorizeDevice());

    return (
        <StyledModal
            heading={<Translation id="TR_WALLET_DUPLICATE_TITLE" />}
            description={<Translation id="TR_WALLET_DUPLICATE_DESC" />}
            data-test="@passphrase-duplicate"
            bottomBarComponents={
                <>
                    <Button
                        variant="primary"
                        onClick={handleSwitchDevice}
                        isDisabled={isDeviceLocked}
                    >
                        <Translation id="TR_WALLET_DUPLICATE_SWITCH" />
                    </Button>
                    <Button
                        variant="secondary"
                        onClick={handleAuthorizeDevice}
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
