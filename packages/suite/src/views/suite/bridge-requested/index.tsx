import { useCallback, useEffect, useState } from 'react';

import { Translation } from '@suite/intl';
import { goto } from '@suite/router';
import { selectConnectPopupCall } from '@suite-common/connect-popup';
import { Card, Column, H3, H4, Modal, Paragraph } from '@trezor/components';
import { isDesktop } from '@trezor/env-utils';
import { AppWindowIcon, CaretLeftIcon } from '@trezor/icons';
import { desktopApi } from '@trezor/suite-desktop-api';

import { Metadata } from 'src/components/suite';
import { useDispatch, useLayout, useSelector } from 'src/hooks/suite';
import { AutoStart } from 'src/views/settings/SettingsGeneral/AutoStart';

import { ErrorPage } from '../ErrorPage';

/**
 * This component renders only in desktop version - as an explanation why suite-desktop app was opened using a deeplink from suite-web
 */
export const BridgeRequested = () => {
    const [confirmGoToWallet, setConfirmGoToWallet] = useState(false);
    const popupCall = useSelector(selectConnectPopupCall);

    const dispatch = useDispatch();

    const goToWallet = useCallback(() => dispatch(goto({ routeName: 'wallet-index' })), [dispatch]);

    useEffect(() => {
        // Popup flow started, exit the bridge requested foreground app
        if (popupCall?.state && popupCall.state !== 'finished') {
            goToWallet();
        }
    }, [popupCall, goToWallet]);

    const handleKeepInBackground = () => {
        if (desktopApi.available) {
            desktopApi.appHide();
        }
    };

    useLayout('Bridge');

    if (!isDesktop()) {
        // this component doesn't make sense for web.
        return (
            <Modal>
                <ErrorPage />
            </Modal>
        );
    }

    if (confirmGoToWallet) {
        return (
            <Modal
                intent="warning"
                width={600}
                heading={<Translation id="TR_TREZOR_CONNECT" />}
                onBackClick={() => setConfirmGoToWallet(false)}
                bottomContent={
                    <>
                        <Modal.Button onClick={goToWallet}>
                            <Translation id="TR_YES_CONTINUE" />
                        </Modal.Button>
                        <Modal.Button
                            intent="neutral"
                            priority="secondary"
                            onClick={() => setConfirmGoToWallet(false)}
                        >
                            <Translation id="TR_CANCEL" />
                        </Modal.Button>
                    </>
                }
            >
                <Metadata title="Bridge | Trezor Suite" />
                <Paragraph>
                    <Translation id="TR_BRIDGE_GO_TO_WALLET_DESCRIPTION" />
                </Paragraph>
            </Modal>
        );
    }

    return (
        <Modal
            icon={AppWindowIcon}
            intent="info"
            width={600}
            bottomContent={
                <>
                    <Modal.Button
                        iconLeft={CaretLeftIcon}
                        intent="neutral"
                        priority="secondary"
                        onClick={() => setConfirmGoToWallet(true)}
                        data-testid="@bridge/goto/wallet-index"
                    >
                        <Translation id="TR_TAKE_ME_BACK_TO_WALLET" />
                    </Modal.Button>

                    {desktopApi.available && (
                        <Modal.Button onClick={handleKeepInBackground}>
                            <Translation id="TR_KEEP_RUNNING_IN_BACKGROUND" />
                        </Modal.Button>
                    )}
                </>
            }
        >
            <Metadata title="Bridge | Trezor Suite" />
            <Column gap={4}>
                <H3>
                    <Translation id="TR_TREZOR_CONNECT" />
                </H3>
                <Paragraph intent="neutral" priority="secondary">
                    <Translation id="TR_BRIDGE_REQUESTED_DESCRIPTION" />
                </Paragraph>
            </Column>
            <Card
                header={
                    <H4>
                        <Translation id="TR_BRIDGE_TIP_AUTOSTART" />
                    </H4>
                }
                margin={{ top: 32 }}
            >
                <AutoStart />
            </Card>
        </Modal>
    );
};
