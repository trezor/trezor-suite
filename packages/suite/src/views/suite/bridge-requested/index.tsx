import { useState } from 'react';
import styled from 'styled-components';
import { Translation, Modal, Metadata } from 'src/components/suite';
import { Button, variables } from '@trezor/components';
import { goto } from 'src/actions/suite/routerActions';
import { useDispatch } from 'src/hooks/suite';

const Content = styled.div`
    display: flex;
    flex-direction: column;
    text-align: center;
    flex: 1;
    padding: 0 74px;

    @media screen and (max-width: ${variables.SCREEN_SIZE.SM}) {
        padding: 0;
        min-width: 0;
    }
`;

const StyledButton = styled(Button)`
    path {
        fill: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    }
`;

const Footer = styled.div`
    margin-top: 72px;
    display: flex;
    padding: 0 42px;
    justify-content: space-between;
    width: 100%;

    @media screen and (max-width: ${variables.SCREEN_SIZE.SM}) {
        padding: 0 12px;
    }
`;

const Col = styled.div<{ $justify?: string }>`
    display: flex;
    flex: 1;
    justify-content: ${({ $justify }) => $justify};
`;

/**
 * This component renders only in desktop version
 */
export const BridgeRequested = () => {
    const [confirmGoToWallet, setConfirmGoToWallet] = useState(false);

    const dispatch = useDispatch();

    const goToWallet = () => dispatch(goto('wallet-index'));

    if (confirmGoToWallet) {
        return (
            <Modal
                heading={'Bridge'}
                description={
                    'You sure? device might only be used by a single application at time. So if you have some work in progress using another application with your Trezor device maybe finish it first.'
                }
                data-test="@modal/bridge"
            >
                <Metadata title="Bridge | Trezor Suite" />

                {confirmGoToWallet && (
                    <>
                        <Content>
                            <Button variant="destructive" onClick={goToWallet}>
                                Confirm
                            </Button>
                            <Button onClick={() => setConfirmGoToWallet(false)} type="button">
                                Nope
                            </Button>
                        </Content>
                    </>
                )}
            </Modal>
        );
    }

    return (
        <Modal
            heading={'Bridge'}
            description={`Trezor Suite application was requested by another application in order to make connection with your Trezor device possible.
                     Keep this in background and all will be good. Nobody needs to get hurt`}
        >
            <Metadata title="Bridge | Trezor Suite" />

            <Footer>
                <Col>
                    <StyledButton
                        icon="ARROW_LEFT"
                        variant="tertiary"
                        onClick={() => setConfirmGoToWallet(true)}
                        data-test="@bridge/goto/wallet-index"
                    >
                        <Translation id="TR_TAKE_ME_BACK_TO_WALLET" />
                    </StyledButton>

                    {/* TODO; implement */}
                    <StyledButton>Keep running in background</StyledButton>
                </Col>
            </Footer>
        </Modal>
    );
};
