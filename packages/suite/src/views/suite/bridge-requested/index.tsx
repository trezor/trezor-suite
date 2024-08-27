import { useState } from 'react';
import styled from 'styled-components';
import { Translation, Modal, Metadata } from 'src/components/suite';
import { Button, Image } from '@trezor/components';
import { goto } from 'src/actions/suite/routerActions';
import { useDispatch, useLayout } from 'src/hooks/suite';
import { desktopApi } from '@trezor/suite-desktop-api';

const StyledModal = styled(Modal)`
    ${Modal.BottomBar} {
        > * {
            flex: 1;
            justify-content: space-between;
        }
    }
`;

const StyledImage = styled(Image)`
    align-self: center;
`;

const StyledButton = styled(Button)`
    path {
        fill: ${({ theme }) => theme.legacy.TYPE_LIGHT_GREY};
    }
`;

/**
 * This component renders only in desktop version
 */
export const BridgeRequested = () => {
    const [confirmGoToWallet, setConfirmGoToWallet] = useState(false);

    const dispatch = useDispatch();

    const goToWallet = () => dispatch(goto('wallet-index'));

    const handleKeepInBackground = () => {
        if (desktopApi.available) {
            desktopApi.appHide();
        }
    };

    useLayout('Bridge');

    if (confirmGoToWallet) {
        return (
            <StyledModal
                heading={<Translation id="TR_BRIDGE" />}
                description={<Translation id="TR_BRIDGE_GO_TO_WALLET_DESCRIPTION" />}
                onBackClick={() => setConfirmGoToWallet(false)}
                bottomBarComponents={
                    <>
                        <Button variant="primary" onClick={goToWallet}>
                            <Translation id="TR_YES_CONTINUE" />
                        </Button>
                        <Button variant="tertiary" onClick={() => setConfirmGoToWallet(false)}>
                            <Translation id="TR_CANCEL" />
                        </Button>
                    </>
                }
            >
                <Metadata title="Bridge | Trezor Suite" />
            </StyledModal>
        );
    }

    return (
        <StyledModal
            heading={<Translation id="TR_BRIDGE" />}
            description={<Translation id="TR_BRIDGE_REQUESTED_DESCRIPTION" />}
            isHeadingCentered
            bottomBarComponents={
                <>
                    <StyledButton
                        icon="caretLeft"
                        variant="tertiary"
                        onClick={() => setConfirmGoToWallet(true)}
                        data-testid="@bridge/goto/wallet-index"
                    >
                        <Translation id="TR_TAKE_ME_BACK_TO_WALLET" />
                    </StyledButton>

                    {desktopApi.available && (
                        <StyledButton onClick={handleKeepInBackground}>
                            <Translation id="TR_KEEP_RUNNING_IN_BACKGROUND" />
                        </StyledButton>
                    )}
                </>
            }
        >
            <Metadata title="Bridge | Trezor Suite" />
            <StyledImage image="CONNECT_DEVICE" width="360" />
        </StyledModal>
    );
};
