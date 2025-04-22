import { Column, H3, Link, NewModal, Paragraph } from '@trezor/components';
import { spacings } from '@trezor/theme';
import { DATA_URL } from '@trezor/urls';

import { goto } from 'src/actions/suite/routerActions';
import { Metadata, Translation } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useOpenSuiteDesktop } from 'src/hooks/suite/useOpenSuiteDesktop';
import {
    selectBridgeInstaller,
    selectHasActiveTransport,
    selectHasTransportOfType,
    selectTransportOfType,
} from 'src/reducers/suite/suiteReducer';

// it actually changes to "Install suite desktop"
export const BridgeUnavailable = () => {
    const hasTransport = useSelector(selectHasActiveTransport);
    const isWebUsb = useSelector(selectHasTransportOfType('WebUsbTransport'));
    const bridge = useSelector(selectTransportOfType('BridgeTransport'));
    const bridgeInstaller = useSelector(selectBridgeInstaller);
    const dispatch = useDispatch();

    const preferredTarget = bridgeInstaller?.packages?.find(i => i.preferred === true);
    const target = preferredTarget
        ? `${DATA_URL}${preferredTarget.url}`
        : 'https://github.com/trezor/data/tree/master/bridge/2.0.27';

    const handleOpenSuite = useOpenSuiteDesktop();

    const goToWallet = () => dispatch(goto('wallet-index'));

    // if bridge is running, user will never be directed to this page, but since this page is accessible directly over /bridge url
    // it makes sense to show some meaningful information here
    const description = !bridge
        ? `Using ${isWebUsb ? 'WebUSB' : 'different transport'}. No action required.`
        : `Trezor Bridge HTTP server is running.  Version: ${bridge.version}.`;

    return (
        <NewModal
            data-testid="@modal/bridge"
            iconName="appWindow"
            size="small"
            bottomContent={
                <>
                    <NewModal.Button onClick={handleOpenSuite}>
                        <Translation id="TR_OPEN_TREZOR_SUITE_DESKTOP" />
                    </NewModal.Button>
                    {hasTransport && (
                        <NewModal.Button
                            icon="caretLeft"
                            variant="tertiary"
                            onClick={goToWallet}
                            data-testid="@bridge/goto/wallet-index"
                        >
                            <Translation id="TR_TAKE_ME_BACK_TO_WALLET" />
                        </NewModal.Button>
                    )}
                </>
            }
        >
            <Metadata title="Bridge | Trezor Suite" />
            <Column gap={spacings.xxs}>
                <H3>
                    <Translation id="TR_BRIDGE" />
                </H3>
                <Paragraph variant="tertiary">
                    {hasTransport ? description : <Translation id="TR_BRIDGE_NEEDED_DESCRIPTION" />}
                </Paragraph>
                <Paragraph variant="tertiary">
                    Alternatively you may{' '}
                    <Link variant="underline" href={target}>
                        download
                    </Link>{' '}
                    a standalone Trezor Bridge binary.
                </Paragraph>
            </Column>
        </NewModal>
    );
};
