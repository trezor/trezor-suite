import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { DATA_URL, HELP_CENTER_TOR_URL, GITHUB_BRIDGE_CHANGELOG_URL } from '@trezor/urls';
import { Translation, TrezorLink, Modal, Metadata } from 'src/components/suite';
import { Button, Paragraph, Link, variables, Spinner } from '@trezor/components';
import { goto } from 'src/actions/suite/routerActions';
import { isDesktop, isWeb } from '@trezor/env-utils';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectTorState } from 'src/reducers/suite/suiteReducer';
import { isWebUsb } from 'src/utils/suite/transport';
import TrezorConnect from '@trezor/connect';

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

export const BridgeRequested = () => {
    const [isSuiteDesktopRunning, setIsSuiteDesktopRunning] = useState<boolean | undefined>(
        undefined,
    );
    const [isBridgeRunning, setIsBridgeRunning] = useState<boolean | undefined>(undefined);
    const [confirmGoToWallet, setConfirmGoToWallet] = useState(false);

    const { isTorEnabled } = useSelector(selectTorState);
    const transport = useSelector(state => state.suite.transport);
    const dispatch = useDispatch();

    const data = {
        currentVersion: transport?.type === 'BridgeTransport' ? transport!.version : null,
        latestVersion: transport?.bridge ? transport.bridge.version.join('.') : null,
        uri: DATA_URL,
    };

    const goToWallet = () => dispatch(goto('wallet-index'));

    if (confirmGoToWallet) {
        return (
            <Modal
                heading={'Bridge'}
                description={'You sure? device might only be used by a single application at time'}
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

    if (transport?.type === 'BridgeTransport') {
        // not 100%, this is true only for latest suite-desktop release

        return (
            <Modal
                heading={'Bridge'}
                description={`Bridge was requested by another application. Keep this in background and all will be good. Nobody needs to get hurt`}
            >
                <Metadata title="Bridge | Trezor Suite" />

                <Footer>
                    <Col $justify="flex-start">
                        <StyledButton
                            icon="ARROW_LEFT"
                            variant="tertiary"
                            onClick={() => setConfirmGoToWallet(true)}
                            data-test="@bridge/goto/wallet-index"
                        >
                            <Translation id="TR_TAKE_ME_BACK_TO_WALLET" />
                        </StyledButton>
                    </Col>
                </Footer>
            </Modal>
        );
    }
    return null;
};
