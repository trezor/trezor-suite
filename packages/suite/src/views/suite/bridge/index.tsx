import { Translation } from '@suite/intl';
import { goto } from '@suite/router';
import { Column, H3, Modal, Paragraph } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { Metadata } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useOpenSuiteDesktop } from 'src/hooks/suite/useOpenSuiteDesktop';
import {
    selectHasActiveTransport,
    selectHasTransportOfType,
    selectTransportOfType,
} from 'src/selectors/suite/suiteSelectors';

// it actually changes to "Install suite desktop"
export const BridgeUnavailable = () => {
    const hasTransport = useSelector(selectHasActiveTransport);
    const isWebUsb = useSelector(selectHasTransportOfType('WebUsbTransport'));
    const bridge = useSelector(selectTransportOfType('BridgeTransport'));
    const dispatch = useDispatch();

    const handleOpenSuite = useOpenSuiteDesktop();

    const goToWallet = () => dispatch(goto({ routeName: 'wallet-index' }));

    // if bridge is running, user will never be directed to this page, but since this page is accessible directly over /bridge url
    // it makes sense to show some meaningful information here
    const description = !bridge
        ? `Using ${isWebUsb ? 'WebUSB' : 'different transport'}. No action required.`
        : `Trezor Bridge HTTP server is running.  Version: ${bridge.version}.`;

    return (
        <Modal
            data-testid="@modal/bridge"
            iconName="appWindow"
            width={600}
            bottomContent={
                <>
                    <Modal.Button onClick={handleOpenSuite}>
                        <Translation id="TR_OPEN_TREZOR_SUITE_DESKTOP" />
                    </Modal.Button>
                    {hasTransport && (
                        <Modal.Button
                            iconLeft="caretLeft"
                            intent="neutral"
                            priority="secondary"
                            onClick={goToWallet}
                            data-testid="@bridge/goto/wallet-index"
                        >
                            <Translation id="TR_TAKE_ME_BACK_TO_WALLET" />
                        </Modal.Button>
                    )}
                </>
            }
        >
            <Metadata title="Bridge | Trezor Suite" />
            <Column gap={spacings.xxs}>
                <H3>
                    <Translation id="TR_BRIDGE" />
                </H3>
                <Paragraph intent="neutral" priority="secondary">
                    {hasTransport ? description : <Translation id="TR_BRIDGE_NEEDED_DESCRIPTION" />}
                </Paragraph>
            </Column>
        </Modal>
    );
};
