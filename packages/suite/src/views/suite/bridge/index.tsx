import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { DATA_URL, HELP_CENTER_TOR_URL } from '@trezor/urls';
import { Translation, TrezorLink, Modal, Metadata } from 'src/components/suite';
import { Button, Paragraph, variables } from '@trezor/components';
import { goto } from 'src/actions/suite/routerActions';
import { isWeb } from '@trezor/env-utils';
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

const Version = styled.div<{ $show: boolean }>`
    visibility: ${({ $show }) => ($show ? 'visible' : 'hidden')};
    margin-top: 10px;
    font-size: ${variables.FONT_SIZE.SMALL};
`;

const Col = styled.div<{ $justify?: string }>`
    display: flex;
    flex: 1;
    justify-content: ${({ $justify }) => $justify};
`;

// it actually changes to "Install suite desktop"
export const InstallBridge = () => {
    const [isSuiteDesktopRunning, setIsSuiteDesktopRunning] = useState<boolean | undefined>(
        undefined,
    );
    const [confirmGoToWallet, setConfirmGoToWallet] = useState(false);

    const { isTorEnabled } = useSelector(selectTorState);
    const transport = useSelector(state => state.suite.transport);
    const dispatch = useDispatch();

    const data = {
        currentVersion: transport?.type === 'BridgeTransport' ? transport!.version : null,
        latestVersion: transport?.bridge ? transport.bridge.version.join('.') : null,
        uri: DATA_URL,
    };

    useEffect(() => {
        fetch('http://localhost:21335')
            .then(res => setIsSuiteDesktopRunning(res.ok))
            .catch(() => setIsSuiteDesktopRunning(false));

        // fetch('http://localhost:21325')
        //     .then(res => setIsBridgeRunning(res.ok))
        //     .catch(() => setIsBridgeRunning(false));
    });

    console.log('transport', transport);
    console.log('isWebusb', isWebUsb(transport));

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

    // if bridge is running, user will never be directed to this page, but since this page is accessible directly over /bridge url
    // it makes sense to show some meaningful information here
    if (transport?.type === 'BridgeTransport') {
        // not 100%, this is true only for latest suite-desktop release
        const isBundled = transport?.bridge?.version?.[0] === 3;

        return (
            <Modal
                heading={'Bridge'}
                description={`Trezor Bridge is a http server is running. ${isBundled ? 'Bundled' : 'Standalone'} version: ${transport?.bridge?.version.join('.')} `}
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

                        <Button
                            // href="trezorsuite://bridge-requested-by-a-3rd-party"
                            onClick={() => {
                                if (isWebUsb(transport)) {
                                    console.log('calling disable webusb');
                                    TrezorConnect.disableWebUSB();
                                }

                                window.open('trezorsuite://bridge-requested-by-a-3rd-party');
                            }}
                        >
                            Use desktop app instead
                        </Button>
                    </Col>
                </Footer>
            </Modal>
        );
    }

    // again, if webusb is running, user should never be directed to this page. for cases of direct access to /bridge url, display some info as well.
    if (transport?.type === 'WebUsbTransport') {
        <Modal
            heading="Transport - Webusb"
            description="Cool,  you are using webusb. No action needed"

            // todo: back button (or modal should have close button)
        ></Modal>;
    }

    return (
        <Modal
            heading={'Bridge'}
            description={
                'To guarantee the best support for various 3rd party applications, run your Trezor Suite application in the background.'
            }
            data-test="@modal/bridge"
        >
            <Metadata title="Bridge | Trezor Suite" />

            <Content>
                <Version $show={!!data.currentVersion}>
                    <Translation
                        id="TR_TREZOR_BRIDGE_RUNNING_VERSION"
                        values={{ version: data.currentVersion }}
                    />
                </Version>

                <>
                    {isSuiteDesktopRunning && 'Suite desktop is running'}

                    <div>
                        {!isSuiteDesktopRunning && <Button>Download Suite Desktop</Button>}
                        <Button
                            // href="trezorsuite://bridge-requested-by-a-3rd-party"
                            onClick={() => {
                                if (isWebUsb(transport)) {
                                    console.log('calling disable webusb');
                                    TrezorConnect.disableWebUSB();
                                }

                                window.open('trezorsuite://bridge-requested-by-a-3rd-party');
                            }}
                        >
                            Open Trezor Suite desktop app
                        </Button>
                    </div>
                </>
            </Content>
            <Footer></Footer>
        </Modal>
    );
};
