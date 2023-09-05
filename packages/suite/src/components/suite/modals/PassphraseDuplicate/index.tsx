import styled from 'styled-components';
import { Button, Image } from '@trezor/components';
import { Translation, Modal } from 'src/components/suite';
import { authorizeDevice, switchDuplicatedDevice } from 'src/actions/suite/suiteActions';
import { useDevice, useDispatch } from 'src/hooks/suite';
import { TrezorDevice } from 'src/types/suite';

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

type PassphraseDuplicateProps = {
    device: TrezorDevice;
    duplicate: TrezorDevice;
};

export const PassphraseDuplicate = ({ device, duplicate }: PassphraseDuplicateProps) => {
    const dispatch = useDispatch();
    const { isLocked } = useDevice();

    const isDeviceLocked = isLocked();

    const handleSwitchDevice = () => dispatch(switchDuplicatedDevice(device, duplicate));
    const handleAuthorizeDevice = () => dispatch(authorizeDevice());

    return (
        <StyledModal
            heading={<Translation id="TR_WALLET_DUPLICATE_TITLE" />}
            description={<Translation id="TR_WALLET_DUPLICATE_DESC" />}
            data-test="@passphrase-duplicate"
            bottomBar={
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
