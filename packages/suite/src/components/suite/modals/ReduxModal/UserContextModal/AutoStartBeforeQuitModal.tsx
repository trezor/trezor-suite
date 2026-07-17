import { useEffect, useState } from 'react';

import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { closeModal } from '@suite/modal';
import { useServices } from '@suite-common/dependency-injection';
import { Card, Checkbox, Column, Modal, Paragraph } from '@trezor/components';
import { desktopApi } from '@trezor/suite-desktop-api';

import { useDispatch } from 'src/hooks/suite';

export const AutoStartBeforeQuitModal = () => {
    const dispatch = useDispatch();
    const { analytics } = useServices(selectDesktopAnalyticsDep);
    const [dontAskAgain, setDontAskAgain] = useState(false);
    useEffect(() => {
        if (desktopApi.available) desktopApi.appAutoStartPopupAck();
    }, []);

    if (!desktopApi.available) return null;

    const handleResponse = (
        action: 'background-always' | 'background-now' | 'quit-always' | 'quit-now',
    ) => {
        desktopApi.appAutoStartPopupResponse(action);
        dispatch(closeModal());
        analytics.report({
            type: events.autostartModalEvent.name,
            payload: {
                action,
            },
        });
    };
    const handleBackground = () => {
        handleResponse(dontAskAgain ? 'background-always' : 'background-now');
    };
    const handleQuit = () => {
        handleResponse(dontAskAgain ? 'quit-always' : 'quit-now');
    };

    return (
        <Modal
            data-testid="@auto-start-before-quit"
            intent="brand"
            onCancel={() => handleQuit()}
            heading={<Translation id="TR_RUN_IN_BACKGROUND_TITLE" />}
            bottomContent={
                <>
                    <Modal.Button
                        onClick={() => handleBackground()}
                        data-testid="@auto-start-before-quit/button-background"
                    >
                        <Translation id="TR_RUN_IN_BACKGROUND" />
                    </Modal.Button>
                    <Modal.Button
                        onClick={() => handleQuit()}
                        data-testid="@auto-start-before-quit/button-quit"
                        intent="neutral"
                        priority="secondary"
                    >
                        <Translation id="TR_QUIT_NOW" />
                    </Modal.Button>
                </>
            }
        >
            <Column gap={16}>
                <Paragraph>
                    <Translation id="TR_RUN_IN_BACKGROUND_DESCRIPTION" />
                </Paragraph>
                <Card>
                    <Checkbox
                        data-testid="auto-start-before-quit/dont-ask-again-checkbox"
                        isChecked={dontAskAgain}
                        onChange={() => setDontAskAgain(!dontAskAgain)}
                    >
                        <Translation id="TR_DONT_ASK_AGAIN" />
                    </Checkbox>
                </Card>
            </Column>
        </Modal>
    );
};
