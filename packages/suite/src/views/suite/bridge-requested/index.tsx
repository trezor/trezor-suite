import { useState } from 'react';

import { Card, Column, H3, Modal, Paragraph, Text } from '@trezor/components';
import { isDesktop } from '@trezor/env-utils';
import { desktopApi } from '@trezor/suite-desktop-api';
import { spacings } from '@trezor/theme';

import { goto } from 'src/actions/suite/routerActions';
import { Metadata, Translation } from 'src/components/suite';
import { useDispatch, useLayout } from 'src/hooks/suite';
import { AutoStart } from 'src/views/settings/SettingsGeneral/AutoStart';

/**
 * This component renders only in desktop version - as an explanation why suite-desktop app was opened using a deeplink from suite-web
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

    if (!isDesktop()) {
        // this component doesn't make sense for web.
        return null;
    }

    if (confirmGoToWallet) {
        return (
            <Modal
                variant="warning"
                size="small"
                heading={<Translation id="TR_BRIDGE" />}
                onBackClick={() => setConfirmGoToWallet(false)}
                bottomContent={
                    <>
                        <Modal.Button onClick={goToWallet}>
                            <Translation id="TR_YES_CONTINUE" />
                        </Modal.Button>
                        <Modal.Button
                            variant="tertiary"
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
            iconName="appWindow"
            variant="info"
            size="small"
            bottomContent={
                <>
                    <Modal.Button
                        icon="caretLeft"
                        variant="tertiary"
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
            <Column gap={spacings.xxs}>
                <H3>
                    <Translation id="TR_BRIDGE" />
                </H3>
                <Paragraph variant="tertiary">
                    <Translation id="TR_BRIDGE_REQUESTED_DESCRIPTION" />
                </Paragraph>
            </Column>
            <Card
                label={
                    <Text typographyStyle="label">
                        <Translation id="TR_BRIDGE_TIP_AUTOSTART" />
                    </Text>
                }
                margin={{ top: spacings.xxl }}
            >
                <AutoStart />
            </Card>
        </Modal>
    );
};
