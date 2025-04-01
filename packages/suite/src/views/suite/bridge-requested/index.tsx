import { useState } from 'react';

import { Card, Column, H3, NewModal, Paragraph, Text } from '@trezor/components';
import { isDesktop } from '@trezor/env-utils';
import { desktopApi } from '@trezor/suite-desktop-api';
import { spacings } from '@trezor/theme';

import { goto } from 'src/actions/suite/routerActions';
import { Metadata, Translation } from 'src/components/suite';
import { useDispatch, useLayout } from 'src/hooks/suite';
import { AutoStart } from 'src/views/settings/SettingsGeneral/AutoStart';

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
            <NewModal
                variant="warning"
                size="small"
                heading={<Translation id="TR_BRIDGE" />}
                onBackClick={() => setConfirmGoToWallet(false)}
                bottomContent={
                    <>
                        <NewModal.Button onClick={goToWallet}>
                            <Translation id="TR_YES_CONTINUE" />
                        </NewModal.Button>
                        <NewModal.Button
                            variant="tertiary"
                            onClick={() => setConfirmGoToWallet(false)}
                        >
                            <Translation id="TR_CANCEL" />
                        </NewModal.Button>
                    </>
                }
            >
                <Metadata title="Bridge | Trezor Suite" />
                <Paragraph>
                    <Translation id="TR_BRIDGE_GO_TO_WALLET_DESCRIPTION" />
                </Paragraph>
            </NewModal>
        );
    }

    return (
        <NewModal
            iconName="appWindow"
            variant="info"
            size="small"
            bottomContent={
                <>
                    <NewModal.Button
                        icon="caretLeft"
                        variant="tertiary"
                        onClick={() => setConfirmGoToWallet(true)}
                        data-testid="@bridge/goto/wallet-index"
                    >
                        <Translation id="TR_TAKE_ME_BACK_TO_WALLET" />
                    </NewModal.Button>

                    {desktopApi.available && (
                        <NewModal.Button onClick={handleKeepInBackground}>
                            <Translation id="TR_KEEP_RUNNING_IN_BACKGROUND" />
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
                    <Translation id="TR_BRIDGE_REQUESTED_DESCRIPTION" />
                </Paragraph>
            </Column>
            {!isDesktop() && (
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
            )}
        </NewModal>
    );
};
