import styled from 'styled-components';
import { Translation, Modal, Metadata } from 'src/components/suite';
import { Button } from '@trezor/components';
import { goto } from 'src/actions/suite/routerActions';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { isWebUsb } from 'src/utils/suite/transport';
import { useOpenSuiteDesktop } from 'src/hooks/suite/useOpenSuiteDesktop';

const StyledButton = styled(Button)`
    path {
        fill: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    }
`;

const Footer = styled.div`
    width: 100%;
    margin-top: 72px;
    display: flex;
    justify-content: space-between;
`;

// it actually changes to "Install suite desktop"
export const BridgeUnavailable = () => {
    const transport = useSelector(state => state.suite.transport);
    const dispatch = useDispatch();

    const handleOpenSuite = useOpenSuiteDesktop();

    const goToWallet = () => dispatch(goto('wallet-index'));

    // if bridge is running, user will never be directed to this page, but since this page is accessible directly over /bridge url
    // it makes sense to show some meaningful information here
    if (transport?.type) {
        // not 100%, this is true only for latest suite-desktop release
        const isBundled = transport?.bridge?.version?.[0] === 3;

        const description = isWebUsb(transport)
            ? `Using WebUSB. No action required.`
            : `Trezor Bridge HTTP server is running. ${isBundled ? 'Bundled' : 'Standalone'} version: ${transport?.bridge?.version.join('.')} `;

        return (
            <Modal
                heading={<Translation id="TR_BRIDGE" />}
                description={description}
                data-test="@modal/bridge"
            >
                <Metadata title="Bridge | Trezor Suite" />

                <Footer>
                    <StyledButton
                        icon="ARROW_LEFT"
                        variant="tertiary"
                        onClick={goToWallet}
                        data-test="@bridge/goto/wallet-index"
                    >
                        <Translation id="TR_TAKE_ME_BACK_TO_WALLET" />
                    </StyledButton>

                    <Button onClick={handleOpenSuite}>
                        <Translation id="TR_OPEN_TREZOR_SUITE_DESKTOP" />
                    </Button>
                </Footer>
            </Modal>
        );
    }

    return (
        <Modal
            heading={<Translation id="TR_BRIDGE" />}
            description={<Translation id="TR_BRIDGE_NEEDED_DESCRIPTION" />}
            data-test="@modal/bridge"
        >
            <Metadata title="Bridge | Trezor Suite" />

            <Footer>
                <Button onClick={handleOpenSuite}>
                    <Translation id="TR_OPEN_TREZOR_SUITE_DESKTOP" />
                </Button>
            </Footer>
        </Modal>
    );
};
